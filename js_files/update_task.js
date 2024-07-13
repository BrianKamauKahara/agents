import { PromptTemplate } from "@langchain/core/prompts"
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers"
import dotenv from 'dotenv';
dotenv.config()

const taskTemplate =  `
A task has the following fields:
Title - Summary of the task
Description - Very brief description of the task
Date - Date by which the task should be complete
Time - Time by which the task should be complete
Label - Just One appropriate descriptive word that summarises the entire task
`

const promptTemplate = PromptTemplate.fromTemplate(
    `
    system
    You are a model designed to extract specific details from a task query\\n

    {TASK_TEMPLATE} \\n\\n

    Given the query, extract the information above that is outlined in the query. \\n\\n

    Return a JSON object that contains an arbitrary number of keys, Depending on how many details you could extract.\\n 
    
    If a detail is missing, do not add it to the JSON object\\n
    
    If a title is to be changed, then it is likely that the description will change as well; and vice versa.\\n

    If the query has implicitly define a date or time, use the following information to fill the fields.\\n
    Current time [DAY,DATE,TIME] {date}. The date is in year-month-day format, and time in 24h system. \\n

    If the query has not implicitly or explicitly defined a date or time, do not add it to the JSON object \\n

    Refer to the following examples\\n
    Date: ['Friday', '2022-08-33', '11:03:04']
    User: Meeting for 9:00am postponed to 1:00pm\\n
    
    Result: 
    {{"Time":"1:00pm"}} \\n

    Date: ['Friday', '2024-01-3', '18:03:04']
    User: Change title from Date with Abigael to date with Abigail\\n
    
    Result: 
    {{"Title":"Date with Abigail,
      "Description":"You have a date with Abigail",}} \\n

    Date: ['Friday', '2024-02-19', '5:03:04']
    User: Change baby shower from today to tomorrow\\n
    
    Result: 
    {{"Date":"2024-02-20"}} \\n

    Notice below, that the current date was Tuesday. Next week Wednesday is 8 days later. This date is 2024-07-2:\\n
    Date: ['Tuesday', '2024-06-25', '10:03:04']
    User: Change the date with Abby from Wednesday to next week Wednesday.\\n
    
    Result: 
    {{"Date":"2024-07-2"}} \\n
    

    user
    Question: {query} \\n
    assistant
    `
  );

const model = new ChatOpenAI({
    temperature: 0.5,
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-3.5-turbo"
}).bind({
    response_format: {
      type: "json_object",
    }})

const taskModificationChain = promptTemplate.pipe(model).pipe(new JsonOutputParser())

export const updateTask = async (state) => {
    if (state.multiple){
        state.task_output.splice(state.num_tasks - 1, 1);
    }
    console.log("Currently Updating task!")
    const result = await taskModificationChain.invoke(
        {
            "query": state.ref_query, 
            "TASK_TEMPLATE": taskTemplate,
            "date":state.date
        }
        )
    state.task_output = [{"UTQ":result},...state.task_output.filter(x => x !== null)]
    return state
}
