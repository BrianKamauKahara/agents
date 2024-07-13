import dotenv from 'dotenv';
dotenv.config()

export const deleteTask = async (state) => {
    if (state.multiple){
        state.task_output.splice(state.num_tasks - 1, 1);
    }
    console.log("Currently deleting a task!")
    const result = "Can't do this yet!"
        
    state.task_output = [{"DTQ":result},...state.task_output.filter(x => x !== null)]
    return state
}