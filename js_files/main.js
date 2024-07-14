import { createTask } from './create_task.js'
import { updateTask } from './update_task.js'
import { deleteTask } from './delete_task.js'
import { generateGeneralAnswer } from './general_question.js'
import { generateWebsiteAnswer } from './website_question.js'
import { mixedQueryHandler } from './mixed_query.js'
import { determineTaskType } from './determine_query_type.js'
import { determineNextFunction, returnNextFunction, checkWhetherMQ, getDayDateTime} from './workflow_functions.js'
import dotenv from 'dotenv';
dotenv.config()


const compileAnswer = async (state) => {
    console.log(state)
    state.task_output.forEach(task => {
        console.log(task)
    }); ;
    console.log(state.task_output)
    return state
}
export const destructureUserQueryByAI = async (state) => {
    await determineTaskType(state)
    await getDayDateTime(state)
    const functionMap = {
        "CTQ": createTask,
        "UTQ": updateTask,
        "DTQ": deleteTask,
        "WQ": generateWebsiteAnswer,
        "GQ": generateGeneralAnswer,
        "DONE":compileAnswer
    };
    const nextFunc = await returnNextFunction(state)
    const funcToCall = functionMap[nextFunc] || mixedQueryHandler;
    await funcToCall(state)
    if (nextFunc !== "MQ"){
        await compileAnswer(state)
    } else {
        while (await returnNextFunction !== 'done'){
            await determineNextFunction(state)
            const nextFunc2 = await returnNextFunction(state)
            const funcToCall2 = functionMap[nextFunc2];
            if (nextFunc2 == "DONE"){
                break}
            await funcToCall2(state)
        }
        await compileAnswer(state)
    }
}
const adadads = {
    'query':"I want to go shopping in the afternoon, and then in the evening, go watch a movie, and late at night, watch another movie",
    'ref_query':'',
    'q_type': "TBD",
    'task_output': [],
    'multiple': false,
    'num_tasks':0,
    'date':[]
}
await destructureUserQueryByAI(adadads)