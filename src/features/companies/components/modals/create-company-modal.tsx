import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateCompanyModal } from "../../store/use-create-workspace-company";
import CompaniesAddForm from "../forms/companies-add-form";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrent } from "@/features/auth/api/use-current";
import { AuthError } from "@supabase/supabase-js";
import { getCurrent } from "@/features/auth/actions";

function CreateCompanyModal() {
  const [open, setOpen] = useCreateCompanyModal();
  const queryClient = useQueryClient();
  const { data: user, isSuccess, isLoading } = useCurrent();
  if (user instanceof AuthError || !user) return;


  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajoutez une entreprise</DialogTitle>
          <DialogDescription>
            Vous êtes sur le point d&apos;ajouter une entreprise à votre compte.
            Vous serez considéré comme le propriétaire de cette entreprise.
          </DialogDescription>
        </DialogHeader>

        <CompaniesAddForm
          defaultUsersInCompany={[user.id]}
          disableUsersSelect={true}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CreateCompanyModal;
