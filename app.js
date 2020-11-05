const ipfsClient = require('ipfs-http-client');
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const ipfs = new ipfsClient({ host: 'localhost', port: '5001', protocol: 'http'});
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());

app.get('/', (req, res) => {
    res.render('home');
});
app.get('/show',(req, res) =>{

    arr = fs.readFileSync('link.txt',"utf8").toString().split("\n");
    res.render('show',{arr: arr});
})
app.post('/upload', (req, res) => {
    const file = req.files.file;
    const fileName = req.body.fileName;
    const filePath = 'files/' + fileName;

    file.mv(filePath, async(err) => {
        if(err){
            console.log('Error: Failed to download the file');
            return res.status(500).send(err);
      
      }
      const fileHash = await addFile(fileName, filePath);
      fs.unlink(filePath, (err) => {
          if(err) console.log(err);
      });
      res.render('upload',{ fileName, fileHash});

    })
});

const addFile = async (fileName,filePath)  => {
    try {
        const file = fs.readFileSync(filePath);
        const fileAdded =  await ipfs.add({path: fileName, content: file});
       
        const fileHash = fileAdded.cid.string;
        fs.writeFile('link.txt',"https://ipfs.io/ipfs/"+fileHash+"\n",
        {
            encoding: "utf-8",
            flag: "a",
            mode: 0o666
        } ,

        (err) => {
            if(err) throw err;

        })
       return fileHash;
    }catch(e){

    }
    
}

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});