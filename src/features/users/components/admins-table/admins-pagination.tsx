import { Button } from "@/components/ui/button"

interface AdminsPaginationProps {
  totalCount: number
  filteredCount: number
}

export function AdminsPagination({ totalCount, filteredCount }: AdminsPaginationProps) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-sm text-muted-foreground">
        Affichage de {filteredCount} sur {totalCount} clients
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
