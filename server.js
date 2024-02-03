
const keypair=require('keypair');
var net_server = require('net');
//let sequenceNumberByClient = new Map();
const fs=require('fs');
const ECKey = require('ec-key');
var text;
var make_key;
var pem;
var key;
const { exec, spawn } = require('child_process');
function sleep(t){
   return new Promise(resolve=>setTimeout(resolve,t));
}
function set_key(){
	exec('openssl ecparam -genkey -name prime256v1 -out ecprivkey.pem && openssl ec -in ecprivkey.pem -pubout -out ecpubkey.pem && rand_generator.exe', (err, stdout, stderr) => {
	  if (err) {
	    console.error(err);
	    return;
	  }
	  console.log(stdout);
	});
}
function read_key(){
	make_key=fs.readFileSync("./ecprivkey.pem",'utf8');
	pem="-----BEGIN EC PRIVATE KEY-----"+make_key.split("-----BEGIN EC PRIVATE KEY-----")[1];
	//console.log(pem);
}
set_key();
(async function(){
  await sleep(1000);
  read_key();
})();


var server = net_server.createServer(function(client) {
    console.info(`Client connected`);
    //sequenceNumberByClient.set(client, 1);
    //client.setTimeout(100000);
    client.setEncoding('utf8');
    var send_random_data="";
    var prev_text;
    client.on('data', function(data) {
    	for(var i=0;i<parseInt(data);i++){
	    	while(1){
	    		var text=fs.readFileSync("./random_number.txt",'utf8');
	    		if(text.indexOf("random_number")!=-1){
		    		text = (text.split("random_number : ")[1]).trim()+"\n";
	  				if(text==prev_text)continue;
	  				else{
	  					//console.log(text);
	  					prev_text=text;
	  					send_random_data+=text;
	  					break
	  				}
	  			}
	    	}
	    }
	    writeData(client, send_random_data.trim()+"::random_number");
    	key = keypair(512);
    	writeData(client, fs.readFileSync("./ecpubkey.pem",'utf8'));
    	writeData(client, pem);
    	writeData(client, (key.public).toString());
    	writeData(client, (key.private).toString());
    	
    	//console.log('  Bytes sent: ' + client.bytesWritten);
    });
    client.on('end', function() {
    //	sequenceNumberByClient.delete(client);
        console.info(`Client gone`);
    });
    client.on('error', function(err) {
        console.log('Socket Error: ', JSON.stringify(err));
    });
    client.on('timeout', function() {
        console.log('Socket Timed out');
    });
});
 
server.listen(1234, function() {
    console.log('Server listening 1234');
    server.on('close', function(){
        console.log('Server Terminated 1234');
    });
    server.on('error', function(err){
        console.log('Server Error 1234: ', JSON.stringify(err));
    });
});
 
 
function writeData(socket, data){
  var success = socket.write(data);
  if (!success){
    console.log("Client Send Fail");
  }
}
