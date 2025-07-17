import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrent } from "@/features/auth/api/use-current";
import { AuthError } from "@supabase/supabase-js";
import { useCreateCustomerModal } from "../store/use-create-customer";
import CustomersAddForm from "../forms/customers-add-form";

function CreateCustomerModal() {
  const [open, setOpen] = useCreateCustomerModal();
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
          <DialogTitle>Ajoutez un client</DialogTitle>
          <DialogDescription>
            Vous êtes sur le point d&apos;ajouter un client à votre compte.
          </DialogDescription>
        </DialogHeader>

        <CustomersAddForm />
      </DialogContent>
    </Dialog>
  );
}

export default CreateCustomerModal;
