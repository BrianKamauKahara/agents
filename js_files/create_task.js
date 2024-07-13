import { PromptTemplate } from "@langchain/core/prompts"
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers"
import dotenv from 'dotenv';
import { stat } from "fs";
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

    Given the query, extract the information above. \\n\\n

    Return a JSON object that contains five keys as per the classification of details.\\n 
    
    If a detail is missing, instead write 'None'\\n
    
    If the query has implicitly define a date or time, use the following information to fill the fields.\\n
    Current time [DAY,DATE,TIME] {date}. The date is in year-month-day format, and time in 24h system. \\n

    If the query has not implicitly or explicitly defined a date or time, the default time for date is today, and time is 11:59pm. However, be smart. For example, you can't schedule a meeting for 10:00am today, if it is already 5pm; it can only be tomorrow 10:00am.\\n

    The title, label and description can only be missing when no description is in the query. Otherwise, always craft a suitable title, label and description\\n

    Refer to the following examples\\n

    
    User: Schedule meeting for 9:00pm today\\n
    
    Result: 
    {{"Title":"Meeting",
      "Description":"You have a meeting today",
      "Date":"2024-07-12",
      "Time":"9:00pm",
      "Label":"Meeting"}} \\n

    Notice below that two-weeks time is calculated from the current date:\\n
    Date: {{'date': ['Friday', '2022-11-13', '16:53:01']}}
    User: Son's basketball game in two weeks!\\n
    
    Result: 
    {{"Title":"Son's BasketBall Game",
      "Description":"Don't miss your son's basketball game!",
      "Date":"2022-11-25",
      "Time":"11:59pm",
      "Label":"Game"}} \\n

    Notice for this example, it is already 4 pm. Therefore, the meeting can only be tomorrow as default\\n
    Date: {{'date': ['Friday', '2023-06-1', '16:53:01']}}
    User: Baby shower 10 o'clock\\n
    
    Result: 
    {{"Title":"Baby shower",
      "Description":"Attend a baby shower",
      "Date":"2023-06-1",
      "Time":"10:00am",
      "Label":"Event"}} \\n
    
    user
    Question: {query} \\n
    assistant
    `
  );

const model = new ChatOpenAI({
    temperature: 0.5, 
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY
}).bind({
    response_format: {
      type: "json_object",
    }})



const taskCreationChain = promptTemplate.pipe(model).pipe(new JsonOutputParser())


export const createTask = async (state) => {
    if (state.multiple){
        state.task_output.splice(state.num_tasks - 1, 1);
    }
    console.log("Currently Creating task!")
    const result = await taskCreationChain.invoke(
        {
            "query": state.ref_query, 
            "TASK_TEMPLATE": taskTemplate,
            "date":state.date
        }
        )
    if (state.task_output){
      state.task_output = [{"CTQ":result},...state.task_output.filter(x => x !== null)]
    } else{
      state.task_output = [{"CTQ":result}]
    }
    return state
}



