import { atom, useAtom } from "jotai";

const modalAtom = atom(false);

export const useCreateCustomerModal = () => {
  return useAtom(modalAtom);
};
