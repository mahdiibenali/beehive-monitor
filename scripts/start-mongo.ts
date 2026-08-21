import { MongoMemoryServer } from "mongodb-memory-server";

async function start() {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbPath: process.cwd() + "/.mongo-data",
      storageEngine: "wiredTiger",
    },
  });
  console.log("MongoDB running at:", mongod.getUri());
  process.on("SIGINT", async () => {
    await mongod.stop();
    process.exit(0);
  });
}
start();
