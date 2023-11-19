"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const path = __importStar(require("path"));
const Datastore = require("nedb");
class Worker {
    constructor() {
        this.db = new Datastore({
            filename: path.join(__dirname, "contacts.db"),
            autoload: true
        });
    }
    //return all records in contacts.db file
    listContacts() {
        return new Promise((inResolve, inReject) => {
            console.log("listing contact");
            this.db.find({}, (inError, inDocs) => {
                if (inError) {
                    inReject(inError);
                }
                else {
                    inResolve(inDocs);
                }
            });
        });
    }
    addContact(inContact) {
        return new Promise((inResolve, inReject) => {
            console.log("Adding contact", inContact);
            this.db.insert(inContact, 
            //the first parameter in the callback function should be Error or null
            (inError, inNewDocs) => {
                if (inError) {
                    inReject(inError);
                }
                else {
                    inResolve(inNewDocs);
                }
            });
        });
    }
    deleteContact(inID) {
        return new Promise((inResolve, inReject) => {
            console.log("Deleting contact", inID);
            this.db.remove({ _id: inID }, {}, (inError, inNumberRemoved) => {
                if (inError) {
                    inReject(inError);
                }
                else {
                    inResolve("OK");
                }
            });
        });
    }
    updateContact(inID, inContact) {
        return new Promise((inResolve, inReject) => {
            console.log("Updating contact", inID, inContact);
            // copy the id so it will not change
            const updateData = Object.assign({}, inContact);
            delete updateData._id;
            this.db.update({ _id: inID }, { $set: updateData }, {}, (inError, inNumUpdated) => {
                if (inError) {
                    inReject(inError);
                }
                else {
                    inResolve(inContact);
                }
            });
        });
    }
}
exports.Worker = Worker;
//# sourceMappingURL=contacts.js.map