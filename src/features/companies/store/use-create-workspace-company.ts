import { atom, useAtom } from "jotai";

const modalAtom = atom(false);

export const useCreateCompanyModal = () => {
  return useAtom(modalAtom);
};
