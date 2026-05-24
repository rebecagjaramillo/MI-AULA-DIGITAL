import { MongoClient } from 'mongodb';

const uri = 'mongodb://mi_aula_user:NiwGVaH0Lnar1ZoD@ac-xmsztqg-shard-00-00.wcbts3d.mongodb.net:27017,ac-xmsztqg-shard-00-01.wcbts3d.mongodb.net:27017,ac-xmsztqg-shard-00-02.wcbts3d.mongodb.net:27017/?ssl=true&replicaSet=atlas-8ysv1n-shard-0&authSource=admin&appName=Cluster0';

// Eliminamos las opciones obsoletas
const options = {
  connectTimeoutMS: 10000,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb() {
  const client = await clientPromise;
  return client.db('mi_aula_digital');
}