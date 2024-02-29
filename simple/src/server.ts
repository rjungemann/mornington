import * as dotenv from 'dotenv';
import {app} from "./app";

dotenv.config();
const port = parseInt(process.env.PORT || '3001', 10);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
