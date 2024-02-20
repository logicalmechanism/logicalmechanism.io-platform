// "datum": "",
// "amount": 1241342,
//  "address": "addr1qx3qsmd38cjgek4rslexscdjm84tz7qgzkr8tgpc6muf7vp8g49ne6fsh6pk7lhn5g5tjyy6tncjyrlcgqc58v24ukdsz67m3z",
//  "amts": [],
//  "redeemer": "",
//  "block_number": 9496297,
//  "tkns": [],
//  "slot": 107381524,
//  "id": "59de4239564fb539304167cd2d37a592c275a91dff67df184b7efbd6f42f92b3#1",
//  "pids": [],
//  "timestamp": 1698947815,
//  "stake_key": "27454b3ce930be836f7ef3a228b9109a5cf1220ff8403143b155e59b"

import React from 'react';
import { Col, Row } from 'antd';

const UTxO = ({ item }) => {
  return (
    <div style={{paddingTop: '1.5vh'}}>
      <Row>
        <Col span={24}>{item.id}</Col>
        <Col span={6}>Lovelace: {item.amount}</Col>
        <Col span={6}>Block: {item.block_number}</Col>
        <Col span={6}>Slot: {item.slot}</Col>
        <Col span={6}>Timestamp: {item.timestamp}</Col>
      </Row>
    </div>
  );
};

export default UTxO;
