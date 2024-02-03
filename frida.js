const NodeRSA = require('node-rsa');
var net_client = require('net'); 
var BSON=require('bson');
var base64=require('base-64');
var utf8=require('utf8');
const ECKey = require('ec-key');
var fix_ecx;
var start=0;
var rsakey;
var partner_rsa_pub_key_pem;
var partner_rsakey;
var partner_ec_pub_key_pem;
var partner_ec_pub_key;
var partner_signature;
var real_partner=false;
var ec_pri_key;
var ec_pub_key_pem;
var rsa_pub_key_pem;
var signature;

global.random_random=[];

function getConnection(port) {
  var client = "";
  var recvData = "";
  var local_port = "";
  client = net_client.connect({
    port: port,
    host: 'localhost'
  }, function () {
    console.log('connect success');
  });
  client.on('close', function () {
    console.log("client Socket Closed");
  }); // 데이터 수신 후 처리 

  client.on('data', function (data) {
      recvData += data.toString();
      console.log("receiving data... " + data.length); //console.log("data recv : " + data);

      if (data.indexOf("-----END RSA PRIVATE KEY-----") != -1) {
        console.log("recvData : " + recvData.length);
        var random_number=recvData.split("::random_number")[0];
        random_number=random_number.split("\n");
        for(var i=0;i<random_number.length;i++){
        	random_random.push(parseInt(random_number[i]));
      	}
        rsakey = new NodeRSA(recvData);
        console.log("RSA PRIVATE KEY GENERATED!");
        ec_pri_key = new ECKey(recvData, 'pem');

        console.log("EC PRIVATE KEY GENERATED!");

        var ec_tmp_pub_key_pem="-----BEGIN PUBLIC KEY----"+recvData.split("-----BEGIN PUBLIC KEY----")[1];
        ec_pub_key_pem=ec_tmp_pub_key_pem.split("-----END PUBLIC KEY-----")[0]+"-----END PUBLIC KEY-----";
       // ec_pub_key = new ECKey(ec_pub_key_pem, 'pem');
        console.log("EC PUBLIC KEY_PEM GENERATED!");
        
        var rsa_tmp_key = "-----BEGIN RSA PUBLIC KEY-----" + recvData.split("-----BEGIN RSA PUBLIC KEY-----")[1];
        rsa_pub_key_pem = rsa_tmp_key.split("-----END RSA PUBLIC KEY-----")[0] + "-----END RSA PUBLIC KEY-----";
        signature = ec_pri_key.createSign('SHA384').update(rsa_pub_key_pem).sign('base64');
        console.log("SIGNATURE FOR RSA PUBKEY GENERATED!");
        
       // const text = 'Hello RSA!';
       // const encrypted = rsakey.encrypt(text, 'base64');
       // console.log('encrypted: ', encrypted);
       // const decrypted = rsakey.decrypt(encrypted, 'utf8');
       // console.log('decrypted: ', decrypted);
        

        client.end();
      }
  });
  client.on('end', function () {
    console.log('client Socket End');
  });
  client.on('error', function (err) {
    console.log('client Socket Error: ' + (0, _stringify["default"])(err));
  });
  client.on('timeout', function () {
    console.log('client Socket timeout: ');
  });
  client.on('drain', function () {
    console.log('client Socket drain: ');
  });
  client.on('lookup', function () {
    console.log('client Socket lookup: ');
  });
  return client;
}

function writeData(socket, data){
  var success = socket.write(data);
  if (!success){
      console.log("Server Send Fail");
  }
}
/*
function print_data(data, client, callback){
	console.log(data.length);
    var key=new NodeRSA(data);
   // client.end();
	callback(key);
	
}
*/


var client = getConnection(1234);
writeData(client, "500")


Interceptor.attach(ptr(0xD1FE20), {
	onEnter: function(args){
		var cmd=Memory.readCString(ptr(parseInt(args[0])+6));
		if(cmd=="WRITE"){
			
			/*
			if(fix_ecx!=undefined){
			//console.log(fix_ecx.toString(16));
				this.context.ecx=ptr(fix_ecx);
			}
			*/	
			//BSON.deserilalize
			
			var buffer=Memory.readByteArray(ptr(parseInt(args[0])+0x16), parseInt(args[1])-0x16);
			
			var bson_data=BSON.deserialize(new Buffer(buffer), {promoteLongs: false});
			if(bson_data.msg=="END")start=0;

			if(start){
				
				//console.log(JSON.stringify(bson_data));
				console.log("\n###########################\nSEND       message : "+bson_data.msg);
				//Modify Messge
				bson_data.msg=partner_rsakey.encrypt(utf8.encode(bson_data.msg), 'base64');
				//bson_data_de.msg='[B64] '+base64.encode(utf8.encode(bson_data_de.msg));
				console.log("SEND->RECV message : "+bson_data.msg+"\n###########################\n");
				//BSON.serialize
				var newserialized=BSON.serialize(bson_data);
				var newbyte=[];
				for(var i=0;i<newserialized.length;i++){
					newbyte.push(newserialized[i]);
				}
				//console.log(newserialized);
				//Modify args
				Memory.writeInt(ptr(parseInt(args[0])+0x12), newserialized.length);
				Memory.writeByteArray(ptr(parseInt(args[0])+0x16), newbyte);
				args[1]=ptr(newserialized.length+0x16);
			}
			if(bson_data.msg=="START"){
				start=1;
				bson_data.msg=utf8.encode(rsa_pub_key_pem+ec_pub_key_pem+signature);
				var newserialized=BSON.serialize(bson_data);
				var newbyte=[];
				for(var i=0;i<newserialized.length;i++){
					newbyte.push(newserialized[i]);
				}
				//console.log(newserialized);
				//Modify args
				Memory.writeInt(ptr(parseInt(args[0])+0x12), newserialized.length);
				Memory.writeByteArray(ptr(parseInt(args[0])+0x16), newbyte);
				//console.log(newserialized.length+0x16);
				args[1]=ptr(newserialized.length+0x16);

			}
		}
	}
});

Interceptor.attach(ptr(0xD3AF70),{
	onEnter: function(args){
		//console.log("EBX is...: "+this.context.ebx);
	
			//fix_ecx=parseInt(this.context.ebx)+0xB0;
			//console.log("Then, ECX is...: 0x"+fix_ecx.toString(16));
			//BSON.deserilalize
			
			var buffer=Memory.readByteArray(ptr(args[0]), args[1].toInt32());		
			var bson_data=BSON.deserialize(new Buffer(buffer), {promoteLongs: false});
			if(bson_data.chatLog!=undefined){
				if(bson_data.chatLog.message.indexOf("-----END RSA PUBLIC KEY-----")!=-1){
					partner_rsa_pub_key_pem=bson_data.chatLog.message.split("-----END RSA PUBLIC KEY-----")[0]+"-----END RSA PUBLIC KEY-----";
					var partner_ec_pub_key_pem_tmp="-----BEGIN PUBLIC KEY----"+bson_data.chatLog.message.split("-----BEGIN PUBLIC KEY----")[1];
					partner_ec_pub_key_pem=partner_ec_pub_key_pem_tmp.split("-----END PUBLIC KEY-----")[0]+"-----END PUBLIC KEY-----";
					partner_signature=bson_data.chatLog.message.split("-----END PUBLIC KEY-----")[1];
					partner_ec_pub_key = new ECKey(partner_ec_pub_key_pem, 'pem');
         			real_partner=partner_ec_pub_key.createVerify('SHA384').update(partner_rsa_pub_key_pem).verify(partner_signature,'base64');
          			if(real_partner){
          				partner_rsakey=new NodeRSA(partner_rsa_pub_key_pem);
          				console.log("REAL PARTNER & RSA PUBLIC KEY GENERATED!");
          			}
				}
				else{
					if(real_partner){
						console.log("\n###########################\nRECV       message : "+bson_data.chatLog.message);
						//Modify Messge
						bson_data.chatLog.message=rsakey.decrypt(bson_data.chatLog.message, 'utf8');//'[Blind]'+Math.random();
						console.log("RECV->SEND message : "+bson_data.chatLog.message+"\n###########################\n");
						/*
						setTimeout(function(){
							var alloc=Memory.alloc(1024);
							alloc.writeByteArray(my_buffer);
							mysend(alloc, my_buffer.length, 0);
						
						},100)
						*/
						//BSON.serialize
						var newserialized=BSON.serialize(bson_data);
						var newbyte=[];
						for(var i=0;i<newserialized.length;i++){
							newbyte.push(newserialized[i]);
						}
						//Modify args
						Memory.writeByteArray(ptr(args[0]), newbyte);
						args[1]=ptr(newserialized.length);
					}
				}
			}
	}
});     