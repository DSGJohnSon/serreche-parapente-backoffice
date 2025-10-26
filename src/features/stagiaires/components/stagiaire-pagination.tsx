import { Button } from "@/components/ui/button"

interface StagiairePaginationProps {
  totalCount: number
  filteredCount: number
}

export function StagiairePagination({ totalCount, filteredCount }: StagiairePaginationProps) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-sm text-muted-foreground">
        Affichage de {filteredCount} sur {totalCount} stagiaires
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled>
          Précédent
        </Button>
        <Button variant="outline" size="sm" disabled>
          Suivant
        </Button>
      </div>
    </div>
  )
}