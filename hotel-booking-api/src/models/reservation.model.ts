import { ObjectId } from "mongodb";

export interface Reservation {
  _id?: ObjectId;
  userId: ObjectId;    
  roomId: ObjectId;    
  startDate: Date;     
  endDate: Date;       
  guestCount: number;  
  createdAt?: Date;    
  updatedAt?: Date;    
}