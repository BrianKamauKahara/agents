import { createTask } from './js_files/create_task.js'
import { updateTask } from './js_files/update_task.js'
import { deleteTask } from './js_files/delete_task.js'
import { generateGeneralAnswer } from './js_files/general_question.js'
import { generateWebsiteAnswer } from './js_files/website_question.js'
import { mixedQueryHandler } from './js_files/mixed_query.js'
import { determineTaskType } from './js_files/determine_query_type.js'
import { determineNextFunction, returnNextFunction, checkWhetherMQ, getDayDateTime} from './js_files/workflow_functions.js'
import dotenv from 'dotenv';
dotenv.config()

console.log(process.env.OPENAI_API_KEY)
console.log(process.env.DUSB)
import { END, START, StateGraph } from "@langchain/langgraph"



const userQuestion = "Schedule a meeting for me at 6pm"

const testState = {
        'query':"",
        'ref_query':userQuestion,
        'q_type': "TBD",
        'task_output': [{"help":"me"},null],
        'multiple': false,
        'num_tasks':0,
        'date':[]
    }

const graphState = {
    query: {
        value: (state) => {console.log('##########');console.log('SADASDSDDS',query);console.log('#####');return state.query ? state.query : 'I am'},
        default: () => "I am default",
    },
    ref_query: {
        value: (state) => state.ref_query,
        default: () => "",
    },
    q_type: {
        value: (state) => state.q_type,
        default: () => "",
    },
    task_output: {
        value: (state) => state.task_output,
        default: () => [],
    },
    multiple: {
        value: (state) => state.multiple,
        default: () => false,
    },
    num_tasks: {
        value: (state) => state.num_tasks,
        default: () => "",
    },
    date: {
        value: (state) => state.date,
        default: () => [],
    },
};

const builder = new StateGraph({ channels: graphState })

const compileAnswer = async (state) => {
    console.log(state)
    return state
}

builder.addNode("CTQ", createTask)
builder.addNode("UTQ", updateTask)
builder.addNode("DTQ", deleteTask)
builder.addNode("WQ", generateWebsiteAnswer)
builder.addNode("GQ", generateGeneralAnswer)
builder.addNode("MQ", mixedQueryHandler)
builder.addNode("QRYTYP", determineTaskType)
builder.addNode("GETTYM", getDayDateTime)
builder.addNode("COMPANS", compileAnswer)
builder.addNode("DET_NXT_IN_MULT", determineNextFunction)



builder.addEdge(START,"QRYTYP")

builder.addEdge("QRYTYP","GETTYM")
builder.addConditionalEdges(
    "GETTYM",
    returnNextFunction,
    {
        "CTQ": "CTQ",
        "UTQ": "UTQ",
        "DTQ": "DTQ",
        "WQ": "WQ",
        "GQ": "GQ",
        "MQ": "MQ",
    }
    )

builder.addEdge("MQ","DET_NXT_IN_MULT")
const nodelist = ["CTQ","UTQ","DTQ","WQ","GQ"]
const addCedges = async (nodelist) =>{
    nodelist.forEach(node => {
        builder.addConditionalEdges(
            node,
            checkWhetherMQ,
            {
                "single":"COMPANS",
                "multiple":"DET_NXT_IN_MULT"
            }
            )
        })}
builder.addConditionalEdges(
    "DET_NXT_IN_MULT",
    returnNextFunction,
    {
        "CTQ": "CTQ",
        "UTQ": "UTQ",
        "DTQ": "DTQ",
        "WQ": "WQ",
        "GQ": "GQ",
        "DONE":"COMPANS"
    }
    )


await addCedges(nodelist)


builder.addEdge("COMPANS",END)





const app = builder.compile()

const myFunc = async (state) => {
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
    'query':"Schedule a meeting for me at 10ppm. Ballet dance for Joan next week!. Reschedule date wit hTalia from 8pm to 10pm tomorrow. Then, delete date with Jorgan tomorrow at 8pm",
    'ref_query':'',
    'q_type': "TBD",
    'task_output': [],
    'multiple': false,
    'num_tasks':0,
    'date':[]
}
await myFunc(adadads)