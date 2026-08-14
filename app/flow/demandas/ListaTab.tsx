import { demoTasks } from "@/data/flow-demo/tasks";
import TaskTable from "./TaskTable";

export default function ListaTab() {
  return (
    <div>
      <TaskTable tasks={demoTasks} emptyMessage="Nenhuma demanda cadastrada." />
    </div>
  );
}
