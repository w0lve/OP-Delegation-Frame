import { serveStatic } from '@hono/node-server/serve-static';
import { Button, Frog, TextInput } from 'frog';
import { devtools } from 'frog/dev';
import { pinata } from 'frog/hubs';

const optimismChainId = 'eip155:10'; // Chain ID for Optimism
const delegateContractAddress = '0x4200000000000000000000000000000000000042'; // Delegate contract address
const tokenContractAddress = '0x4200000000000000000000000000000000000042'; // Token contract address


// Contract ABIs
const delegateAbi = [{
  inputs: [{ internalType: 'address', name: 'delegatee', type: 'address' }],
  name: 'delegate',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function',
}];

const approveAbi = [{
  inputs: [{ internalType: 'address', name: 'spender', type: 'address' },
           { internalType: 'uint256', name: 'amount', type: 'uint256' }],
  name: 'approve',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function',
}];

export const app = new Frog({ 
    basePath: '/api',
    title: 'OP Delegation Farcaster',
    hub: pinata()
  })

// Main Frame
app.frame('/', (c) => {
    return c.res({
        action: '/finish',
        image: (
            <div style={{ color: 'white', display: 'flex', flexDirection: 'column', fontSize: 60 }}>
                <div>Approve the amount of OP to delegate</div>
            </div>
        ),
        intents: [
            <TextInput placeholder="Amount to Approve (OP)"/>,
            <Button.Transaction target="/approve">Approve OP</Button.Transaction>,
            <Button.Transaction target="/delegate">Delegate OP</Button.Transaction>,
        ]
    });
});

// Frame to Display Finish
app.frame('/finish', (c) => {
    const { transactionId, inputText } = c; // Capture inputText for displaying amount
    return c.res({
        image: (
            <div style={{ color: 'white', display: 'flex', flexDirection: 'column', fontSize: 60 }}>
                Transaction ID: {transactionId}
                <div>Amount Delegated: {inputText || '0'} OP</div> {/* Use a default value */}
            </div>
        ),
        action: '/delegate' // Redirect action to /delegate after displaying finish
    });
});

// Approve Transaction Logic
app.transaction('/approve', async (c) => {
    const { inputText } = c;
    const amountToApprove = BigInt(parseFloat(inputText || '0') * 1e18).toString(); // Multiply input by 10^18

    // Call the approve function on the token contract
    return c.contract({
        abi: approveAbi,
        chainId: optimismChainId,
        functionName: 'approve',
        args: [delegateContractAddress, amountToApprove],
        to: tokenContractAddress
    });

});

// Frame to initiate Delegation after Approval
app.frame('/delegate', (c) => {
    return c.res({
        action: '/performDelegate',
        image: (
            <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
                Approve completed. Now delegate your OP tokens.
            </div>
        ),
        intents: [
            <Button.Transaction target="/performDelegate">Delegate OP</Button.Transaction>,
        ]
    });
});

// Delegate Transaction Logic
app.transaction('/performDelegate', (c) => {
    const { address } = c; // Get user's connected address

    // Call the delegate function
    return c.contract({
        abi: delegateAbi,
        chainId: optimismChainId,
        functionName: 'delegate',
        args: [address],
        to: delegateContractAddress
    });
});

devtools(app, { serveStatic });
