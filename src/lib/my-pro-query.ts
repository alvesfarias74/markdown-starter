import { queryOptions } from "@tanstack/react-query";
import { getMyProfessional } from "./professionals.functions";

export const myProQuery = () => queryOptions({ queryKey: ["my-professional"], queryFn: () => getMyProfessional() });
