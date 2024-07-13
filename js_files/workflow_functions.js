export const determineNextFunction  = async (state) => {
    const currentTask = state.num_tasks
    console.log(`Currently determining function ${currentTask + 1}`)
    const taskObject = state.task_output[currentTask]
    const newQueryType = Object.keys(taskObject)[0]
    const newRefQuery = taskObject[newQueryType]
    state.ref_query = newRefQuery
    state.q_type = newQueryType
    state.num_tasks += 1
    return state
}

export const getDayDateTime = async (state) => {a
    const currentDateTime = new Date();
    const date = currentDateTime.toISOString().split('T')[0];
    const time = currentDateTime.toTimeString().split(' ')[0];
    const day = currentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
    state.date = [day, date, time]
    return state;
}

export const checkWhetherMQ = async (state) => {
    if (state.multiple){
        return 'multiple'
    } else {
        return 'single'
    }
}

export const returnNextFunction = async (state) => {
    if (state.multiple){
        if (state.multiple >= state.task_output.length && state.task_output.length > 0){
            return 'done'
        }
    }
    return state.q_type
}


