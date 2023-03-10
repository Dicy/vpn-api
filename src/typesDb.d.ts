type ObjectId = {
  $oid: string;
}

type NumberInt = {
  $numberInt: string;
}

type AccountDocument = {
  _id: string;
  password: string;
  permissionLevel: NumberInt;
}