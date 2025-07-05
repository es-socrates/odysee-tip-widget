# Odysee Tip Widget

Receive notifications on OBS when a tip in AR (arweave) hits your wallet in the livestream on Odysee.

![Odysee tip Widget](https://thumbs.odycdn.com/8f71bc0012a11aecc9691710eaf5e5f5.webp)

## AR Tip Notification Widget for OBS

This widget displays real-time notifications when you receive tips on your Odysee live stream. Designed to integrate easily with OBS Studio.

## Prerequisites

1. Node.js v16 or higher (latest LTS version recommended).
2. npm (included with Node.js).
3. OBS Studio.

## Installation

Clone this repository or download the files. Open a terminal in the project folder. Run the following command to install the dependencies:

Use the command: **npm install**. Rename the **.env.example file to .env** in the project root and change the AR wallet address (arweave).

```
WALLET_ADDRESS=AR wallet address
PORT=3000
```

Save the changes and then run **npm start** at the terminal. The server will run the app and you can monitor it in the terminal.

## OBS Integration:

1. In OBS Studio, add a new "Source" of type "Browser" to your scene.
2. Set the URL to http://localhost:3000.
3. Adjust the size according to your needs.

And that's it, the widget is now working. You can monitor the entire process from the terminal and check for any unexpected errors. You can also test it temporarily from a web browser before using it in OBS or any live streaming software.

## Main Dependencies:

1. Express: Web server
1. WebSockets: Real-time communication
1. Axios: HTTP requests
1. dotenv: Environment variable management

## Some considerations:

The widget's styles and messages are fully customizable from the project files. If you'd like to run some **local notification testing** before receiving any real transactions, you can use this command below.

## For the terminal on Windows:

```
url.exe -X POST http://localhost:3000/notify `
>> -H "Content-Type: application/json" `
>> -d '{"from":"XXX","amount":"0.40","txId":"XXX"}'
```

## For the terminal on Linux:

```
curl -X POST http://localhost:3000/notify \
  -H "Content-Type: application/json" \
  -d '{"from":"XXX","amount":"0.40","txId":"XXX"}'
```

The widget receives notifications the moment the transaction enters the block for confirmation, so it may take a few minutes to display depending on the congestion of the blockweave.

The widget doesn't display the username or channel that sent the channel tip on Odysee. Some users may prefer this for privacy reasons.

**This is an independent project for fun; it is not an official Odysee product.**