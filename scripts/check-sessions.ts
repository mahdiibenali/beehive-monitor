import mongoose from "mongoose";
import { connectToDatabase } from "../lib/mongodb";
import { Apiculteur } from "../models/Apiculteur";

async function run() {
  try {
    await connectToDatabase();
    const apics = await Apiculteur.find({});
    let sessionCount = 0;
    
    console.log(`Found ${apics.length} apiculteurs in DB.`);
    
    for (const a of apics) {
      for (const f of a.fermes) {
        for (const g of f.gateways) {
          if (g.sessions && g.sessions.length > 0) {
            console.log(`Apiculteur ${a.name}, Ferme ${f.name}, Gateway ${g.serialNumber}`);
            console.log(JSON.stringify(g.sessions, null, 2));
            sessionCount += g.sessions.length;
          }
        }
      }
    }
    console.log(`Total sessions found: ${sessionCount}`);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

run();
