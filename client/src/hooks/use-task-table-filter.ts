import { parseAsString, useQueryStates } from "nuqs";

const useTaskTableFilter = () => {
  return useQueryStates({
    status: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    priority: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    keyword: parseAsString,
    projectId: parseAsString,
    assigneeId: parseAsString,
  });
};

export default useTaskTableFilter;
