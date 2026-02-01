// Reference: javascript_object_storage blueprint
import { Client } from "@replit/object-storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
} from "./objectAcl";

// Get the bucket ID from environment
function getBucketId(): string {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
  }
  return bucketId;
}

// Create client with bucket ID
function getStorageClient(): Client {
  return new Client({ bucketId: getBucketId() });
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  private client: Client;
  
  constructor() {
    this.client = getStorageClient();
  }

  // Upload file directly to object storage (server-side upload)
  async uploadFileBuffer(buffer: Buffer, contentType: string): Promise<{ objectPath: string; objectId: string }> {
    const objectId = randomUUID();
    const objectName = `.private/uploads/${objectId}`;
    
    console.log(`Uploading file: ${objectName}, size: ${buffer.length} bytes, type: ${contentType}`);
    
    // Upload using Replit SDK
    const result = await this.client.uploadFromBytes(objectName, buffer);
    
    if (!result.ok) {
      const error = result as { ok: false; error: unknown };
      const errorMsg = typeof error.error === 'string' 
        ? error.error 
        : JSON.stringify(error.error);
      console.error(`Upload failed:`, error.error);
      throw new Error(`Upload failed: ${errorMsg}`);
    }
    
    console.log(`Upload successful: ${objectName}`);
    
    return {
      objectPath: `/objects/uploads/${objectId}`,
      objectId,
    };
  }

  // Helper to convert result value to Buffer
  private toBuffer(value: unknown): Buffer {
    if (Buffer.isBuffer(value)) {
      return value;
    } else if (value instanceof Uint8Array) {
      return Buffer.from(value);
    } else if (Array.isArray(value) && value.length > 0) {
      return Buffer.isBuffer(value[0]) ? value[0] : Buffer.from(value[0] as Uint8Array);
    } else {
      return Buffer.from(value as ArrayBuffer);
    }
  }

  // Gets an object from storage by path - supports multiple path formats
  async getObject(objectPath: string): Promise<{ data: Buffer; exists: boolean }> {
    // Try multiple path resolution strategies
    const pathsToTry: string[] = [];
    
    // Strategy 1: If path starts with /objects/, convert to .private/
    if (objectPath.startsWith("/objects/")) {
      const parts = objectPath.slice(1).split("/");
      if (parts.length >= 2) {
        const entityId = parts.slice(1).join("/");
        pathsToTry.push(`.private/${entityId}`);
      }
    }
    
    // Strategy 2: Try the raw path directly (for legacy uploads)
    pathsToTry.push(objectPath);
    
    // Strategy 3: If path doesn't start with .private/, try adding it
    if (!objectPath.startsWith(".private/") && !objectPath.startsWith("/")) {
      pathsToTry.push(`.private/${objectPath}`);
    }
    
    // Strategy 4: Try without leading slash
    if (objectPath.startsWith("/")) {
      pathsToTry.push(objectPath.slice(1));
    }
    
    // Try each path until one works
    for (const storagePath of pathsToTry) {
      const result = await this.client.downloadAsBytes(storagePath);
      if (result.ok) {
        return { data: this.toBuffer(result.value), exists: true };
      }
    }
    
    // None of the paths worked
    throw new ObjectNotFoundError();
  }

  // Check if object exists
  async objectExists(objectPath: string): Promise<boolean> {
    if (!objectPath.startsWith("/objects/")) {
      return false;
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      return false;
    }

    const entityId = parts.slice(1).join("/");
    const storagePath = `.private/${entityId}`;
    
    const result = await this.client.exists(storagePath);
    return result.ok && result.value;
  }

  // Downloads an object to the response.
  async downloadObject(objectPath: string, res: Response) {
    try {
      const { data } = await this.getObject(objectPath);
      
      // Try to determine content type from the path
      let contentType = "application/octet-stream";
      if (objectPath.includes(".")) {
        const ext = objectPath.split(".").pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
          mp4: "video/mp4",
          webm: "video/webm",
          mov: "video/quicktime",
        };
        if (ext && mimeTypes[ext]) {
          contentType = mimeTypes[ext];
        }
      }
      
      res.set({
        "Content-Type": contentType,
        "Content-Length": data.length,
        "Cache-Control": "private, max-age=3600",
      });
      
      res.send(data);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        if (error instanceof ObjectNotFoundError) {
          res.status(404).json({ error: "Object not found" });
        } else {
          res.status(500).json({ error: "Error downloading file" });
        }
      }
    }
  }

  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already a normalized path, return it
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }
    return rawPath;
  }

  // Sets the ACL policy for an object (stores metadata alongside the object)
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    
    if (!normalizedPath.startsWith("/objects/")) {
      return normalizedPath;
    }

    // Store ACL as a separate metadata file
    const parts = normalizedPath.slice(1).split("/");
    const entityId = parts.slice(1).join("/");
    const aclPath = `.private/${entityId}.acl`;
    
    const aclData = JSON.stringify(aclPolicy);
    await this.client.uploadFromText(aclPath, aclData);
    
    return normalizedPath;
  }

  // Gets the ACL policy for an object
  async getObjectAclPolicy(objectPath: string): Promise<ObjectAclPolicy | null> {
    if (!objectPath.startsWith("/objects/")) {
      return null;
    }

    const parts = objectPath.slice(1).split("/");
    const entityId = parts.slice(1).join("/");
    const aclPath = `.private/${entityId}.acl`;
    
    const result = await this.client.downloadAsText(aclPath);
    
    if (!result.ok) {
      return null;
    }
    
    try {
      return JSON.parse(result.value) as ObjectAclPolicy;
    } catch {
      return null;
    }
  }

  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectPath,
    requestedPermission,
  }: {
    userId?: string;
    objectPath: string;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    const aclPolicy = await this.getObjectAclPolicy(objectPath);
    
    if (!aclPolicy) {
      // No ACL policy means not accessible
      return false;
    }
    
    // Owner can always access
    if (aclPolicy.owner === userId) {
      return true;
    }
    
    // Public objects are readable by anyone
    if (aclPolicy.visibility === "public" && requestedPermission === ObjectPermission.READ) {
      return true;
    }
    
    return false;
  }
}

export { ObjectPermission } from "./objectAcl";
