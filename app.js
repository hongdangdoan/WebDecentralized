const ipfsClient = require('ipfs-http-client');
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const ipfs = new ipfsClient({ host: 'localhost', port: '5001', protocol: 'http'});
const app = express();

var sql = require('mssql');

const config = {
    user: 'sa',
    password: 'sa123',
    server: 'localhost',
    database: 'IMG',
    port: 1433,
    "options": {
        "encrypt": true,
        "enableArithAbort": true
        }
};

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());

app.get('/', (req, res) => {
    
    res.render('home');
});
app.get('/show',(req, res) =>{
     
    var arr;
    sql.connect(config, function(err){
        
        if(err){
            console.log('Loi ket noi database');
            console.log(err);
        }
        let sqlRequest = new sql.Request();
        
        let sqlQuery = 'SELECT * FROM IMG' ;
        sqlRequest.query(sqlQuery,function(err, data){
            if(err){
                console.log('Loi truy van database');
                console.log(err);
            }
            obj = {print: data};
            sql.close();
            res.render('show',{obj: data});
               
        });
        
    });

});
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

    });
});

const addFile = async (fileName,filePath)  => {

        const file = fs.readFileSync(filePath);
        const fileAdded =  await ipfs.add({path: fileName, content: file});
       
        const fileHash = fileAdded.cid.string;
   

        sql.connect(config, function(err){
            if(err){
                console.log('Connect database error');
                console.log(err);
            }
            let sqlRequest = new sql.Request();
            
            let sqlQuery = "INSERT INTO IMG (LINK) VALUES(  "
            +" 'https://ipfs.io/ipfs/" +fileHash+"'"+ ')' ;
            sqlRequest.query(sqlQuery,function(err, data){
                if(err){
                    console.log('Loi truy van database');
                    console.log(err);
                }
                console.table(data.recordset);
                
                sql.close();
            });
        });
}

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
