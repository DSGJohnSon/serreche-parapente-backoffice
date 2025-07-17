import { atom, useAtom } from "jotai";

const modalAtom = atom(false);

export const useAddMonitorModal = () => {
  return useAtom(modalAtom);
};
