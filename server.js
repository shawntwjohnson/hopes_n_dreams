import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('hopes&dreams App is running!');
});

app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});
