import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import generateRoute from './routes/generate.js';
import gradeRoute    from './routes/grade.js';

const app = express();

const corsOptions = {
  origin: ['https://relian-93d83.web.app', 'http://localhost:5173', 'capacitor://localhost', 'https://localhost'],
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use('/api', generateRoute);
app.use('/api/grade', gradeRoute);
app.use('/', generateRoute);
app.use('/grade', gradeRoute);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

export default app;


