import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logoMyJantes from "@assets/cropped-Logo-2-1-768x543_(3)_1767977972324.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-2 border border-border">
            <img 
              src={logoMyJantes} 
              alt="MyJantes Logo" 
              className="h-10 w-auto"
            />
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Se connecter</a>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <section className="py-16 lg:py-24 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 uppercase">
            Les Experts de la Jante Alu
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Rénovation de jantes chez MY JANTES : Qualité exceptionnelle, garantie totale. Choisissez l'excellence pour vos jantes en aluminium !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/api/login" className="text-base">
                Demander mon devis
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-contact">
              <a href="tel:0321408053" className="text-base">
                Nous contacter
              </a>
            </Button>
          </div>
        </section>

        <section className="py-12 mb-16">
          <h3 className="text-3xl font-bold text-center mb-4">Nos services</h3>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Découvrez l'assurance d'une rénovation de jantes exceptionnelle. Notre expertise inégalée, associée à une garantie complète, assure des résultats durables et un éclat durable pour votre véhicule.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 hover-elevate">
              <h4 className="text-xl font-semibold mb-3">Rénovation</h4>
              <p className="text-sm text-muted-foreground">
                Offrez une nouvelle vie à vos jantes avec notre service de rénovation exceptionnel.
              </p>
            </Card>

            <Card className="p-6 hover-elevate">
              <h4 className="text-xl font-semibold mb-3">Personnalisation</h4>
              <p className="text-sm text-muted-foreground">
                Transformez vos jantes en des œuvres d'art uniques grâce à notre service de personnalisation exclusif.
              </p>
            </Card>

            <Card className="p-6 hover-elevate">
              <h4 className="text-xl font-semibold mb-3">Dévoilage</h4>
              <p className="text-sm text-muted-foreground">
                Redonnez à vos trajets une douceur inégalée avec notre service de dévoilage de jantes.
              </p>
            </Card>

            <Card className="p-6 hover-elevate">
              <h4 className="text-xl font-semibold mb-3">Décapage</h4>
              <p className="text-sm text-muted-foreground">
                Offrez une cure de jeunesse à vos jantes avec notre service de décapage.
              </p>
            </Card>
          </div>
        </section>

        <section className="py-12 mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">Pourquoi nous choisir</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-3">Expert dans le domaine</h4>
              <p className="text-sm text-muted-foreground">
                Experts en rénovation de jantes en aluminium, nous garantissons des résultats exceptionnels pour sublimer votre véhicule.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-3">Des années d'expertise</h4>
              <p className="text-sm text-muted-foreground">
                Tous nos employés peuvent justifier d'une expérience de plus de 5 ans dans l'entretien de jantes alliage.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-3">Disponibilité</h4>
              <p className="text-sm text-muted-foreground">
                Nous sommes disponibles du lundi au samedi pour vous apporter la solution la plus adaptée à vos besoins.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-3">Garanties</h4>
              <p className="text-sm text-muted-foreground">
                Qualité exceptionnelle, garantie totale. Choisissez l'excellence pour vos jantes en aluminium.
              </p>
            </Card>
          </div>
        </section>

        <section className="py-12 text-center">
          <h3 className="text-2xl font-bold mb-4">Demandez votre devis gratuit</h3>
          <p className="text-muted-foreground mb-6">
            Avec ou sans rendez-vous
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" asChild data-testid="button-cta">
              <a href="/api/login">Demander mon devis</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="tel:0321408053">Nous contacter : 03.21.40.80.53</a>
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">Nos horaires</p>
            <p>Lundi - Vendredi : 9h–12h / 13.30h-18h</p>
            <p className="mt-2">46 rue de la Convention, 62800 Liévin</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MyJantes. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
