import * as path from "path";
import Nedb from "nedb";
const Datastore = require("nedb");
import { Response } from 'express';

export interface IContact{
    _id?: number, name: string, email: string
}

export class Worker{
    private db: Nedb;
    constructor() {
        this.db = new Datastore({
           filename : path.join(__dirname, "contacts.db"),
           autoload : true
        });
    }

    //return all records in contacts.db file
    public listContacts(): Promise<IContact[]> {
        return new Promise((inResolve, inReject) => {
            console.log("listing contact");
           this.db.find({},
               (inError: Error, inDocs: IContact[]) => {
                   if(inError){
                       inReject(inError);
                   }else{
                       inResolve(inDocs);
                   }
               }
           );
        });
    }

    public addContact(inContact: IContact): Promise<IContact> {
        return new Promise((inResolve, inReject) => {
            console.log("Adding contact", inContact);
            this.db.insert(inContact,
                //the first parameter in the callback function should be Error or null
                (inError: Error | null, inNewDocs: IContact) => {
                    if(inError){
                        inReject(inError);
                    }else{
                        inResolve(inNewDocs);
                    }
                }
            );
        });
    }

    public  deleteContact(inID: string): Promise<string> {
        return new Promise((inResolve, inReject) =>{
            console.log("Deleting contact", inID);
            this.db.remove({_id: inID}, { },
                (inError: Error | null, inNumberRemoved: number) => {
                    if(inError){
                        inReject(inError);
                    }else{
                        inResolve("OK");
                    }
                }
            );
        });
    }

    public updateContact(inID: string, inContact: IContact): Promise<IContact> {
        return new Promise((inResolve, inReject) => {
            console.log("Updating contact", inID, inContact);
            // copy the id so it will not change
            const updateData = { ...inContact };
            delete updateData._id;
            this.db.update({ _id: inID }, { $set: updateData }, {},
                (inError: Error | null, inNumUpdated: number) => {
                    if (inError) {
                        inReject(inError);
                    } else {
                        inResolve(inContact);
                    }
                }
            );
        });
    }

}