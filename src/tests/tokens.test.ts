import { before, describe, test } from "node:test";
import assert from "node:assert";
import { connect } from "..";
import { KeyPairSigner, lamports, Address, address as toAddress } from "@solana/kit";
import { SOL } from "../lib/constants";
import { Connection } from "../lib/connect";

describe("tokens", () => {
  let connection: Connection;
  let sender: KeyPairSigner;
  let mintAddress: Address;
  let recipient: KeyPairSigner;
  const decimals = 9;
  before(async () => {
    connection = connect();
    [sender, recipient] = await connection.createWallets(2, {
      airdropAmount: lamports(1n * SOL),
    });
  });

  test("We can make a new token mint", async () => {
    mintAddress = await connection.createTokenMint({
      mintAuthority: sender,
      decimals,
      name: "Unit test token",
      symbol: "TEST",
      uri: "https://example.com",
      additionalMetadata: {
        keyOne: "valueOne",
        keyTwo: "valueTwo",
      },
    });
    assert.ok(mintAddress);
  });

  test("The mint authority can mintTokens", async () => {
    // Have the mint authority mint to their own account
    const mintTokensTransactionSignature = await connection.mintTokens(mintAddress, sender, 1n, sender.address);
    assert.ok(mintTokensTransactionSignature);
  });

  test("We can get the mint", async () => {
    const mint = await connection.getMint(mintAddress);
    assert.ok(mint);
  });

  test("transferTokens transfers tokens from one account to another", async () => {
    // Transfer 1 token from the mint authority to the recipient
    const transferTokensTransactionSignature = await connection.transferTokens({
      sender,
      destination: recipient.address,
      mintAddress,
      amount: 1n,
    });

    assert.ok(transferTokensTransactionSignature);
  });

  test("getTokenAccountBalance returns the correct balance", async () => {
    const balance = await connection.getTokenAccountBalance(recipient.address, mintAddress, true);
    assert(balance.amount);
    assert(balance.decimals);
    assert(balance.uiAmount);
    assert(balance.uiAmountString);
  });
});

describe("createTokenMint", () => {
  test("createTokenMint makes a new mint with the specified metadata", async () => {
    const connection = connect();

    const mintAuthority = await connection.createWallet({
      airdropAmount: lamports(1n * SOL),
    });

    const name = "Unit test token";
    const symbol = "TEST";
    const decimals = 9;
    const uri = "https://example.com";
    const additionalMetadata = {
      keyOne: "valueOne",
      keyTwo: "valueTwo",
    };
    const mintAddress = await connection.createTokenMint({
      mintAuthority,
      decimals,
      name,
      symbol,
      uri,
      additionalMetadata,
    });

    assert.ok(mintAddress);
  });
});

describe("getTokenAccountAddress", () => {
  const connection = connect();
  const USDC_MINT = toAddress("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const MIKEMACCANA_DOT_SOL_USDC_ACCOUNT = toAddress("4MD31b2GFAWVDYQT8KG7E5GcZiFyy4MpDUt4BcyEdJRP");
  const MIKEMACCANA_DOT_SOL = toAddress("dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8");
  const MIKEMACCANA_DOT_SOL_PYUSD_ACCOUNT = toAddress("ENGDgkjc6Pr8ceS2z4KiKnZU68LoLhHGbQoW6tRARsNk");
  const PYUSD_MINT = toAddress("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo");

  test("getTokenAccountAddress returns the correct token account address for a classic Token program token", async () => {
    const usdcTokenAccountAddress = await connection.getTokenAccountAddress(MIKEMACCANA_DOT_SOL, USDC_MINT);
    assert.equal(usdcTokenAccountAddress, MIKEMACCANA_DOT_SOL_USDC_ACCOUNT);
  });

  test("getTokenAccountAddress returns the correct token account address for a Token Extensions token", async () => {
    const pyusdTokenAccountAddress = await connection.getTokenAccountAddress(MIKEMACCANA_DOT_SOL, PYUSD_MINT, true);
    assert.equal(pyusdTokenAccountAddress, MIKEMACCANA_DOT_SOL_PYUSD_ACCOUNT);
  });
});
