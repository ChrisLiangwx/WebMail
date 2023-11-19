import axios, {AxiosResponse} from "axios";
import {config} from "./config";

export interface IContact{
    _id?: number, name: string, email: string
}

//the client use axios to send http requests to server, pointing at the RESTful endpoints defined in the server
//then server will return result packaged in http responses, which will be received by client
export class Worker{
    public async listContacts() : Promise<IContact[]> {
        const response: AxiosResponse = await axios.get(`${config.serverAddress}/contacts`);
        return response.data;
    }

    public async addContact(inContact: IContact): Promise<IContact> {
        const response: AxiosResponse = await axios.post(`${config.serverAddress}/contacts`, inContact);
        return response.data;
    }

    public async deleteContact(inID) : Promise<void> {
        await axios.delete(`${config.serverAddress}/contacts/${inID}`);
    }

    public async updateContact(inID: string, inContact: IContact): Promise<IContact> {
        const response: AxiosResponse = await axios.put(`${config.serverAddress}/contacts/${inID}`, inContact);
        return response.data;
    }
}