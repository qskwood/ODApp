import React from "react";
import { Contract } from "@ethersproject/contracts";
import { Grid, Form, Box, Card, Text, CardBody, TextInput, Spinner, FormField, Heading, ResponsiveContext, Grommet } from "grommet";
import { HeadingDark, ButtonForm, StyledTextDark, customBreakpoints } from ".";
import { useHistory } from "react-router-dom";
import { ethers } from "ethers";
import detectEthereumProvider from '@metamask/detect-provider';

import addresses from "./abi/addresses";
import abis from "./abi/abis";
import Web3 from "web3";

var provider;
var signer;
var WPKT;
var WPKTAmount;
var amtNoWei;
var feesNoWei;
var PKTAddr;
var ethTxHash;
var dv, dv1, dv2, dv3, dv4, dv5, dv2_2;
var net = 56;

var formWrapStyle = {
  boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.161)",
  width: "85%"
}
var formWrapStyleMed = {
  boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.161)",
  width: "80%"
};
var formWrapStyleMob = {
  boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
  minWidth: "50vw",
  width: "auto"
};

async function handleInput(e){
  dv = document.getElementById("output1");
  dv1 = document.getElementById("spin");
  dv2 = document.getElementById("div1");
  dv3 = document.getElementById("recPKT");
  dv2_2 = document.getElementById("div2");

  // Reset
  dv.style.display= 'none';
  dv1.style.display= 'none';
  dv2.style.display= 'none';
  dv3.style.display= 'none';
  dv2_2.style.display= 'none';





  e.preventDefault();
  WPKTAmount = e.value.WPKTAmount.trim();

  if(isNaN(WPKTAmount)){
    dv.style.display= 'block';
    dv2.style.display= 'block';
    console.log('WPKT amount is not a number');
    dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>Your amount must be a number.</h4>";
    return;
  }


  PKTAddr = e.value.PKTAddr.trim().toString();
  console.log('WPKT Amount to Convert:', WPKTAmount, 'PKT Recipient Address:', PKTAddr);
  if (PKTAddr.charAt(0) == '0'){
    console.log("Bad Address");
    dv.style.display= 'block';
    dv2.style.display= 'block';
    dv1.style.display= 'none';
    dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>Bad PKT Recipient Address.</h4>";
    return;
  }


  // Check that bridge has pkt.
  //var chkCmd = "https://obeahdev.odapp.io/api/v1/getbalances";
  var chkCmd = "https://obeah.odapp.io/api/v1/getbalances";

  var bal = 0;

  fetch(chkCmd)
    .then((response) => response.json())
    .then(async (result) => {
      bal = Number(result.PKT);
      console.log('Data:', result.PKT,(bal > 0));

      if (bal <= 0){
        dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>Your Transaction Cannot be Processed.</h4>";
        dv.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>The bridge hot wallet is paused until refilled.</h6>";
        dv.style.display= 'block';
        dv1.style.display= 'none';
        dv2.style.display= 'block';
        return;
      }
      else{

        const mm_provider = await detectEthereumProvider();
        if (mm_provider) {
          if (mm_provider !== window.ethereum){
            console.log('Multiple wallets installed');
            return;
          }
          else {
              console.log('window.ethereum is current wallet.');
          }

          provider = new ethers.providers.Web3Provider(window.ethereum);
          signer = provider.getSigner();
          WPKT = new Contract(addresses.WPKT, abis.WPKT, signer);
          console.log('WPKT:', WPKT);

          var network = await window.ethereum.request({ method: 'net_version' })
          console.log(network);
          if (Number(network)!= Number(net)){
              dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>Connect Metamask to Binance smart chain Mainnet.</h4>";
              dv1.style.display= 'none';
              dv.style.display= 'block';
              dv2.style.display= 'block';
              return;
          }

          // Submit to smart contract -
          var options = {
              gasLimit: 10000000, //5000000
              gasPrice: 61000000000 //25000000000
          };

          // Encode PKT address as an ETH address. To be used as an on-chain record.
          var pktEncodedAddr = Web3.utils.soliditySha3(PKTAddr.toString());
          pktEncodedAddr = '0x' + pktEncodedAddr.slice(pktEncodedAddr.length-40, pktEncodedAddr.length);
          console.log('PKT Encoded Address', pktEncodedAddr);
          console.log('Is Address', ethers.utils.isAddress(pktEncodedAddr));

          dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>Transaction Pending...</h4>";
          dv.style.display= 'block';
          dv1.style.display= 'block';
          dv2.style.display= 'block';


          var WPKTAmtWei = Web3.utils.toWei(WPKTAmount.toString());
          console.log('Wei Amount:', WPKTAmtWei);

          try {

            var tx = await WPKT.convertToPkt(pktEncodedAddr, WPKTAmtWei);
            console.log('TX:',tx);
            dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>Pending Transaction Hash:</h4><Text margin='small' >" + tx.hash + "</Text><h4 style={{backgroundColor: '#2B2F36'}}>Please wait for confirmation...</h4>";
            ethTxHash = tx.hash;

            var receipt = await tx.wait();
            console.log('Receipt:', receipt, (receipt.status === 1));

            await WPKT.on("Sold", (amount) => {
                amount = Web3.utils.fromWei(amount.toString());
                console.log(amount);
                console.log(amount.toString());
                let fees = ((amount / .965) - amount);
                let originalAmt = (amount / .965);
                amtNoWei = amount;
                feesNoWei = fees;
                console.log("Amount:", amtNoWei, 'Fees:', feesNoWei, 'Original Amt:', originalAmt);
                if (Number(amtNoWei) > 0) {
                    dv1.style.display= 'none';
                    dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>WPKT Successfully Sent</h4><h6 style={{backgroundColor: '#2B2F36'}}><b>Your WPKT transaction hash is " + receipt.transactionHash + "</h6>";
                    dv.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>You sent "+originalAmt+" WPKT tokens to the WPKT contract.</h6>";
                    dv.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>Your fees were "+feesNoWei+" WPKT.</h6>";
                    dv.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>After fees you will receive "+amtNoWei+" PKT.</h6>";
                    dv.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>Use the button \"Claim PKT\" to complete the bridge and receive your PKT. Please save your transaction hash. <p>If there are any issues you can always use your transaction hash to retrieve your PKT.</p></h6>";
                    dv3.style.display= 'block';
                    dv2.style.display= 'block';
                }
            });

            if (receipt.status !== 1) {
                console.log('Transaction Failure.');
                dv1.style.display= 'none';
                dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>Your transaction failed</h4>";
                dv.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>Make sure your entered the correct address and amount.</h6>";
                return;
            }
            else {
              console.log('Transaction Receipt Success. Receipt:', receipt);
              dv1.style.display= 'none';
              dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>WPKT Successfully Sent</h4><h6 style={{backgroundColor: '#2B2F36'}}><b>Your WPKT transaction hash is " + receipt.transactionHash + "</h6>";
              dv2.style.display= 'block';
              dv3.style.display= 'block';
              return;

            }
          }
          catch (err) {
              console.log('Transaction Failure.', err, (err.toString().indexOf('unknown') !== -1 ));
              dv1.style.display='none';
              dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>Your transaction failed</h4>";

              if (err.toString().indexOf('unknown') !== -1 ){
                dv.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>Make sure you are logged into Metamask.</h6>";
              }
              else {
                dv.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>Make sure your entered the correct address and amount.</h6>";
              }
          }
        }
        else{
          console.log('Metamask not running. Is it installed?');
          dv.style.display='block';
          dv2.style.display= 'block';
          dv1.style.display='none';
          dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>Please Install <a href='https://metamask.io/download.html' style='color:#F0B90C;' />Metamask</a></h4>";
        }
      }
    }).catch(function() {
      console.log('No data returned. Either obeah.odapp.io is down, or transaction returned no data.');
      dv.style.display='block';
      dv2.style.display= 'block';
      dv1.style.display='none';
      dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>No data returned. Either obeah.odapp.io is down, or transaction returned no data.</h4>";
      //dv.innerHTML += "<h4 style={{backgroundColor: '#2B2F36'}}><a color='white' href='http://localhost:3000/GetPKT'>Click Here</a></h4>";
      return;
    });
}

function hideForm(){
  var elem1 = document.getElementById("ConvertWPKTtoPKT");
  elem1.style.display = "none";
}

function getPKT(){
  console.log('In get pkt');
  dv1 = document.getElementById("spin");
  dv3 = document.getElementById("recPKT");
  dv4 = document.getElementById("div2");
  dv5 = document.getElementById("output2");

  dv1.style.display= 'block';


  try {

    var cmd = "https://obeah.odapp.io/api/v1/userPayout/txHash/"+ethTxHash+"/address/"+PKTAddr+"/";
    //var cmd = "http://localhost:5000/api/v1/userPayout/txHash/"+ethTxHash+"/address/"+PKTAddr+"/";
    console.log(cmd);
    fetch(cmd)
    .then((response) => response.json())
    .then((result) => {
      console.log('Data:', result.data);
      //dv3.style.display= 'none';//remove button
      if (result.data.toString().includes('Payout Transaction Hash')){
        dv1.style.display= 'none';
        dv5.innerHTML += "<h4 style={{backgroundColor: '#2B2F36'}}>PKT Payout Complete</h4>";
        dv5.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>Your PKT transction hash is: "+result.hash+"</h6>";
        dv5.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>You were sent "+result.amt+" PKT cash.</h6>";
        //dv5.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>Your fees were "+feesNoWei+" WPKT.</h6>";
        dv3.style.display= 'none';
      }
      else if (result.data.toString().includes('already been paid out')){
        dv5.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>This transaction has already been paid out.</h6>";
        if (!result.err2) {
          console.log("POT:",result.POT.toString(),"TID", result.TID.toString());
          dv5.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>The transaction hash is:"+result.TID.toString()+"</h6>";
        }
      }
      else {
        dv5.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>Vault failed to pay out. Check transaction hashes and try resubmission</h6>";
        dv1.style.display= 'none';
      }
      dv4.style.display= 'block';
      dv5.style.display= 'block';
    }).catch(function() {
      console.log('Server Down.');
      dv5.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>Transaction Failure</h4>";
      dv5.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>There was a problem communicating with the bridge servers.</h6>";
      dv5.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>Save your Transaction Hash and try to claim again in a few minutes.</h6>";
      dv5.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>You can also use the \"Claim PKT\" menu item below.</h6>";
      dv1.style.display= 'none';
      dv4.style.display= 'block';
      dv5.style.display= 'block';
    });

  } //try
  catch (err) {
      console.log('Transaction Failure.', err);
      dv.innerHTML = "<h4 style={{backgroundColor: '#2B2F36'}}>Your transaction failed</h4>";
      dv.innerHTML += "<h6 style={{backgroundColor: '#2B2F36'}}>Make sure your entered the correct address and amount.</h6>";
  }
}

function WPKTToPKT() {
  const history = useHistory();
  const navigateTo = () => {
    console.log('OK to receive PKT.', history);
    history.push('/GetPKT')
  }
  const size = React.useContext(ResponsiveContext);


  return (
    <Grommet theme={customBreakpoints}>
    <ResponsiveContext.Consumer>
      {responsive => (responsive === 'smallmob') ? (
        <Box background="#fff">
        <Card width="full" round="none" background="#fff" pad="75px 20px 100px">
              <CardBody>
                <Box background="#fff" justify="center" alignSelf="center">
                    <HeadingDark textAlign="center" margin={{ bottom: "35px", top: "0" }} size="4xl" weight="bold" color="#222323" level="2">Swap WPKT to PKT</HeadingDark>
                    <StyledTextDark textAlign="center">To convert your WPKT to PKT enter the amount of WPKT you wish to convert, and the PKT address that will receive the PKT. Be sure to enter a valid PKT address and not Binance Smart Chain address.</StyledTextDark>
                </Box>
                <Box background="#fff" justify="center" alignSelf="center" pad="50px 0 0">
                    <Box background="#f9f9f9" pad={{ top: "40px", bottom: "50px", horizontal: "20px" }} round="23px" justify="center" alignSelf="center" style={formWrapStyleMob}>
                    <Form name="ConvertWPKTtoPKT" id="ConvertWPKTtoPKT" onSubmit={handleInput}>
                    <Heading style={{ fontWeight: "normal"}} color="#222323" level="3" size="18px" margin={{ bottom: "35px", top: "0" }}  textAlign="center">Enter WPKT Amount and PKT Recipient Address</Heading>
                    <Box justify="center" alignSelf="center">
                        <FormField name="WPKTAmount" required contentProps={{ border: false, margin: "0" }}>
                            <TextInput style={{background: 'white', color: '#222323', fontSize: "18px", fontWeight: "normal", borderRadius: "6px", height: "50px" }} name="WPKTAmount" placeholder={<Text weight="normal" size="18px" color="#707070">Enter Amount of WPKT to Convert</Text>} />
                        </FormField>
                        <FormField name="PKTAddr" required contentProps={{ border: false, margin: "20px 0 0" }}>
                            <TextInput style={{background: 'white', color: '#222323', fontSize: "18px", fontWeight: "normal", borderRadius: "6px", height: "50px" }} name="PKTAddr" placeholder={<Text weight="normal" size="18px" color="#707070">Enter PKT Recipient Address</Text>} />
                        </FormField>
                        <ButtonForm hoverIndicator={{background: "#222323", boxShadow: "0"}} margin={{top: "35px", horizontal: "auto"}} type="submit" label="Submit"/>
                    </Box>
                    </Form>
                    <div hidden id="div1" style={{paddingTop: '2%'}}>
                      <Box id="box1" width="100%" responsive round="small" style={{backgroundColor:'#2B2F36', color:'white',  padding:'0%'}}>
                          <div hidden align="center" id="output1" style={{padding:'2%', wordBreak: "break-word"}}></div>
                          <div hidden align="center" id="recPKT" style={{padding:'2%', wordBreak: "break-word"}}>
                              <ButtonForm size='large' color='#F0B90C' label='Claim PKT' onClick={() => getPKT()}/>
                          </div>
                          <div id="spin" align="center" pad="medium" style={{padding:'2%'}}><Spinner size="large" /></div>
                      </Box>
                    </div>
                    <div hidden id="div2" style={{paddingTop: '2%'}}>
                      <Box id="box2" width="100%" responsive round="small" style={{backgroundColor:'#2B2F36', color:'white',  padding:'0%'}}>
                        <div hidden align="center" id="output2" style={{padding:'2%', wordBreak: "break-word"}}></div>
                      </Box>
                    </div>
                    </Box>
                </Box>
              </CardBody>
              </Card>
          </Box>
      ) : (responsive === 'small') ? (
        <Box background="#fff">
        <Card width="full" round="none" background="#fff" pad="75px 30px 100px">
              <CardBody>
                <Box background="#fff" justify="center" alignSelf="center">
                    <HeadingDark textAlign="center" margin={{ bottom: "35px", top: "0" }} size="4xl" weight="bold" color="#222323" level="2">Swap WPKT to PKT</HeadingDark>
                    <StyledTextDark textAlign="center">To convert your WPKT to PKT enter the amount of WPKT you wish to convert, and the PKT address that will receive the PKT. Be sure to enter a valid PKT address and not Binance Smart Chain address.</StyledTextDark>
                </Box>
                <Box background="#fff" justify="center" alignSelf="center" pad="50px 0 0">
                    <Box background="#f9f9f9" pad={{ top: "40px", bottom: "50px", horizontal: "20px" }} round="23px" justify="center" alignSelf="center" style={formWrapStyleMob}>
                    <Form name="ConvertWPKTtoPKT" id="ConvertWPKTtoPKT" onSubmit={handleInput}>
                    <Heading style={{ fontWeight: "normal"}} color="#222323" level="3" size="18px" margin={{ bottom: "35px", top: "0" }}  textAlign="center">Enter WPKT Amount and PKT Recipient Address</Heading>
                    <Box justify="center" alignSelf="center">
                        <FormField name="WPKTAmount" required contentProps={{ border: false, margin: "0" }}>
                            <TextInput style={{background: 'white', color: '#222323', fontSize: "18px", fontWeight: "normal", borderRadius: "6px", height: "50px" }} name="WPKTAmount" placeholder={<Text weight="normal" size="18px" color="#707070">Enter Amount of WPKT to Convert</Text>} />
                        </FormField>
                        <FormField name="PKTAddr" required contentProps={{ border: false, margin: "20px 0 0" }}>
                            <TextInput style={{background: 'white', color: '#222323', fontSize: "18px", fontWeight: "normal", borderRadius: "6px", height: "50px" }} name="PKTAddr" placeholder={<Text weight="normal" size="18px" color="#707070">Enter PKT Recipient Address</Text>} />
                        </FormField>
                        <ButtonForm hoverIndicator={{background: "#222323", boxShadow: "0"}} margin={{top: "35px", horizontal: "auto"}} type="submit" label="Submit"/>
                    </Box>
                    </Form>
                    <div hidden id="div1" style={{paddingTop: '2%'}}>
                      <Box id="box1" width="100%" responsive round="small" style={{backgroundColor:'#2B2F36', color:'white',  padding:'0%'}}>
                          <div hidden align="center" id="output1" style={{padding:'2%', wordBreak: "break-word"}}></div>
                          <div hidden align="center" id="recPKT" style={{padding:'2%', wordBreak: "break-word"}}>
                              <ButtonForm size='large' color='#F0B90C' label='Claim PKT' onClick={() => getPKT()}/>
                          </div>
                          <div id="spin" align="center" pad="medium" style={{padding:'2%'}}><Spinner size="large" /></div>
                      </Box>
                    </div>
                    <div hidden id="div2" style={{paddingTop: '2%'}}>
                      <Box id="box2" width="100%" responsive round="small" style={{backgroundColor:'#2B2F36', color:'white',  padding:'0%'}}>
                        <div hidden align="center" id="output2" style={{padding:'2%', wordBreak: "break-word"}}></div>
                      </Box>
                    </div>
                    </Box>
                </Box>
              </CardBody>
              </Card>
          </Box>
      ) : (responsive === 'tablet') ? (
        <Box background="#fff">
        <Card width="full" round="none" background="#fff" pad="75px 50px 100px">
              <CardBody>
                <Box background="#fff" justify="center" alignSelf="start">
                    <HeadingDark textAlign="center" margin={{ bottom: "35px", top: "0" }} size="4xl" weight="bold" color="#222323" level="2">Swap WPKT to PKT</HeadingDark>
                    <StyledTextDark textAlign="center">To convert your WPKT to PKT enter the amount of WPKT you wish to convert, and the PKT address that will receive the PKT. Be sure to enter a valid PKT address and not Binance Smart Chain address.</StyledTextDark>
                </Box>
                <Box background="#fff" justify="center" alignSelf="center" pad="50px 0 0">
                    <Box background="#f9f9f9" pad={{ top: "40px", bottom: "50px", horizontal: "20px" }} round="23px" justify="center" alignSelf="center" style={formWrapStyleMob}>
                    <Form name="ConvertWPKTtoPKT" id="ConvertWPKTtoPKT" onSubmit={handleInput}>
                    <Heading style={{ fontWeight: "normal"}} color="#222323" level="3" size="18px" margin={{ bottom: "35px", top: "0" }}  textAlign="center">Enter WPKT Amount and PKT Recipient Address</Heading>
                    <Box justify="center" alignSelf="center">
                        <FormField name="WPKTAmount" required contentProps={{ border: false, margin: "0" }}>
                            <TextInput style={{background: 'white', color: '#222323', fontSize: "18px", fontWeight: "normal", borderRadius: "6px", height: "50px" }} name="WPKTAmount" placeholder={<Text weight="normal" size="18px" color="#707070">Enter Amount of WPKT to Convert</Text>} />
                        </FormField>
                        <FormField name="PKTAddr" required contentProps={{ border: false, margin: "20px 0 0" }}>
                            <TextInput style={{background: 'white', color: '#222323', fontSize: "18px", fontWeight: "normal", borderRadius: "6px", height: "50px" }} name="PKTAddr" placeholder={<Text weight="normal" size="18px" color="#707070">Enter PKT Recipient Address</Text>} />
                        </FormField>
                        <ButtonForm hoverIndicator={{background: "#222323", boxShadow: "0"}} margin={{top: "35px", horizontal: "auto"}} type="submit" label="Submit"/>
                    </Box>
                    </Form>
                    <div hidden id="div1" style={{paddingTop: '2%'}}>
                      <Box id="box1" width="100%" responsive round="small" style={{backgroundColor:'#2B2F36', color:'white',  padding:'0%'}}>
                          <div hidden align="center" id="output1" style={{padding:'2%', wordBreak: "break-word"}}></div>
                          <div hidden align="center" id="recPKT" style={{padding:'2%', wordBreak: "break-word"}}>
                              <ButtonForm size='large' color='#F0B90C' label='Claim PKT' onClick={() => getPKT()}/>
                          </div>
                          <div id="spin" align="center" pad="medium" style={{padding:'2%'}}><Spinner size="large" /></div>
                      </Box>
                    </div>
                    <div hidden id="div2" style={{paddingTop: '2%'}}>
                      <Box id="box2" width="100%" responsive round="small" style={{backgroundColor:'#2B2F36', color:'white',  padding:'0%'}}>
                        <div hidden align="center" id="output2" style={{padding:'2%', wordBreak: "break-word"}}></div>
                      </Box>
                    </div>
                    </Box>
                </Box>
              </CardBody>
              </Card>
          </Box>
      ) : (responsive === 'medium') ? (
        <Box background="#fff">
        <Card width="full" round="none" background="#fff" pad="150px 50px">
              <CardBody>
                <Grid
                fill
                areas={[
                  { name: 'left', start: [0, 0], end: [0, 0] },
                  { name: 'right', start: [1, 0], end: [1, 0] },
                ]}
                columns={['1/2', 'flex']}
                alignContent="center"
                justifyContent="between"
                rows={['flex']}
                gap="none"
                background="#fff"
                >
                <Box gridArea="left" background="#fff" justify="center" alignSelf="start">
                    <HeadingDark textAlign="start" margin={{ bottom: "50px", top: "0" }} size="4xl" weight="bold" color="#222323" level="2">Swap WPKT to PKT</HeadingDark>
                    <StyledTextDark textAlign="start" style={{ paddingRight: "6vw" }}>To convert your WPKT to PKT enter the amount of WPKT you wish to convert, and the PKT address that will receive the PKT. Be sure to enter a valid PKT address and not Binance Smart Chain address.</StyledTextDark>
                </Box>
                <Box gridArea="right" background="#fff" justify="center" alignSelf="center" pad="0">
                    <Box background="#f9f9f9" pad={{ vertical: "large", horizontal: "large" }} round="25px" justify="center" alignSelf="center" style={formWrapStyleMed}>
                    <Form name="ConvertWPKTtoPKT" id="ConvertWPKTtoPKT" onSubmit={handleInput}>
                    <Heading style={{ fontWeight: "normal"}} color="#222323" level="3" size="20px" margin={{ bottom: "35px", top: "0" }}  textAlign="center">Enter WPKT Amount and PKT Recipient Address</Heading>
                    <Box justify="center" alignSelf="center">
                        <FormField name="WPKTAmount" required contentProps={{ border: false, margin: "0" }}>
                            <TextInput style={{background: 'white', color: '#222323', fontSize: "20px", fontWeight: "normal", borderRadius: "6px", height: "50px" }} name="WPKTAmount" placeholder={<Text weight="normal" size="20px" color="#707070">Enter Amount of WPKT to Convert</Text>} />
                        </FormField>
                        <FormField name="PKTAddr" required contentProps={{ border: false, margin: "20px 0 0" }}>
                            <TextInput style={{background: 'white', color: '#222323', fontSize: "20px", fontWeight: "normal", borderRadius: "6px", height: "50px" }} name="PKTAddr" placeholder={<Text weight="normal" size="20px" color="#707070">Enter PKT Recipient Address</Text>} />
                        </FormField>
                        <ButtonForm hoverIndicator={{background: "#222323", boxShadow: "0"}} margin={{top: "35px", horizontal: "auto"}} type="submit" label="Submit"/>
                    </Box>
                    </Form>
                    <div hidden id="div1" style={{paddingTop: '2%'}}>
                      <Box id="box1" width="100%" responsive round="small" style={{backgroundColor:'#2B2F36', color:'white',  padding:'0%'}}>
                          <div hidden align="center" id="output1" style={{padding:'2%', wordBreak: "break-word"}}></div>
                          <div hidden align="center" id="recPKT" style={{padding:'2%', wordBreak: "break-word"}}>
                              <ButtonForm size='large' color='#F0B90C' label='Claim PKT' onClick={() => getPKT()}/>
                          </div>
                          <div id="spin" align="center" pad="medium" style={{padding:'2%'}}><Spinner size="large" /></div>
                      </Box>
                    </div>
                    <div hidden id="div2" style={{paddingTop: '2%'}}>
                      <Box id="box2" width="100%" responsive round="small" style={{backgroundColor:'#2B2F36', color:'white',  padding:'0%'}}>
                        <div hidden align="center" id="output2" style={{padding:'2%', wordBreak: "break-word"}}></div>
                      </Box>
                    </div>
                    </Box>
                </Box>
                </Grid>
              </CardBody>
              </Card>
          </Box>
      ) : (
        <Box background="#fff">
        <Card width="full" round="none" background="#fff" pad="0 8rem" size="large">
              <CardBody>
                <Grid
                fill
                areas={[
                  { name: 'left', start: [0, 0], end: [0, 0] },
                  { name: 'right', start: [1, 0], end: [1, 0] },
                ]}
                columns={['1/2', 'flex']}
                alignContent="center"
                justifyContent="between"
                rows={['flex']}
                gap="none"
                background="#fff"
                >
                <Box gridArea="left" background="#fff" height={{ min: "85vh" }} justify="center" alignSelf="start">
                    <HeadingDark textAlign="start" margin={{ bottom: "50px", top: "0" }} size="4xl" weight="bold" color="#222323" level="2">Swap WPKT to PKT</HeadingDark>
                    <StyledTextDark textAlign="start" style={{ paddingRight: "6vw" }}>To convert your WPKT to PKT enter the amount of WPKT you wish to convert, and the PKT address that will receive the PKT. Be sure to enter a valid PKT address and not Binance Smart Chain address.</StyledTextDark>
                </Box>
                <Box gridArea="right" background="#fff" height="large" justify="center" alignSelf="center" pad="0">
                    <Box background="#f9f9f9" pad={{ vertical: "large", horizontal: "xlarge" }} round="25px" justify="center" alignSelf="center" style={formWrapStyle}>
                    <Form name="ConvertWPKTtoPKT" id="ConvertWPKTtoPKT" onSubmit={handleInput}>
                    <Heading style={{ fontWeight: "normal"}} color="#222323" level="3" size="24px" margin={{ bottom: "50px", top: "0" }}  textAlign="center">Enter WPKT Amount and PKT Recipient Address</Heading>
                    <Box justify="center" alignSelf="center">
                        <FormField name="WPKTAmount" required contentProps={{ border: false, margin: "0" }}>
                            <TextInput style={{background: 'white', color: '#222323', fontSize: "24px", fontWeight: "normal", borderRadius: "6px", height: "60px" }} name="WPKTAmount" placeholder={<Text weight="normal" size="24px" color="#707070">Enter Amount of WPKT to Convert</Text>} />
                        </FormField>
                        <FormField name="PKTAddr" required contentProps={{ border: false, margin: "20px 0 0" }}>
                            <TextInput style={{background: 'white', color: '#222323', fontSize: "24px", fontWeight: "normal", borderRadius: "6px", height: "60px" }} name="PKTAddr" placeholder={<Text weight="normal" size="24px" color="#707070">Enter PKT Recipient Address</Text>} />
                        </FormField>
                        <ButtonForm hoverIndicator={{background: "#222323", boxShadow: "0"}} margin={{top: "50px", horizontal: "auto"}} type="submit" label="Submit"/>
                    </Box>
                    </Form>
                    <div hidden id="div1" style={{paddingTop: '2%'}}>
                      <Box id="box1" width="100%" responsive round="small" style={{backgroundColor:'#2B2F36', color:'white',  padding:'0%'}}>
                          <div hidden align="center" id="output1" style={{padding:'2%', wordBreak: "break-word"}}></div>
                          <div hidden align="center" id="recPKT" style={{padding:'2%', wordBreak: "break-word"}}>
                              <ButtonForm size='large' color='#F0B90C' label='Claim PKT' onClick={() => getPKT()}/>
                          </div>
                          <div id="spin" align="center" pad="medium" style={{padding:'2%'}}><Spinner size="large" /></div>
                      </Box>
                    </div>
                    <div hidden id="div2" style={{paddingTop: '2%'}}>
                      <Box id="box2" width="100%" responsive round="small" style={{backgroundColor:'#2B2F36', color:'white',  padding:'0%'}}>
                        <div hidden align="center" id="output2" style={{padding:'2%', wordBreak: "break-word"}}></div>
                      </Box>
                    </div>
                    </Box>
                </Box>
                </Grid>
              </CardBody>
              </Card>
          </Box>
      )}
    </ResponsiveContext.Consumer>
    </Grommet>
  );
}

export default WPKTToPKT;
