import * as React from 'react';
import {
  Html,
  Body,
  Container,
  Text,
  Row,
  Column
} from '@react-email/components';

export function BiWeeklyReportEmail({
  startKey,
  endKeyExclusive,
  summaryRows
}: {
  startKey: string;
  endKeyExclusive: string;
  summaryRows: {
    name: string;
    email: string;
    hours: string;
    minutes: string;
    days: string;
  }[];
}) {
  return (
    <Html>
      <Body
        style={{
          fontFamily: 'sans-serif',
          backgroundColor: '#f9f9f9',
          padding: '20px'
        }}
      >
        <Container
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px'
          }}
        >
          <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>
            Bi-weekly Hours Report ({startKey} to {endKeyExclusive})
          </Text>
          <table
            style={{
              width: '100%',
              marginTop: '16px',
              borderCollapse: 'collapse'
            }}
          >
            <thead>
              <tr>
                <th
                  style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}
                >
                  User
                </th>
                <th
                  style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}
                >
                  Email
                </th>
                <th style={{ borderBottom: '1px solid #ccc' }}>Hours</th>
                <th style={{ borderBottom: '1px solid #ccc' }}>Minutes</th>
                <th style={{ borderBottom: '1px solid #ccc' }}>Days</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td style={{ textAlign: 'center' }}>{r.hours}</td>
                  <td style={{ textAlign: 'center' }}>{r.minutes}</td>
                  <td style={{ textAlign: 'center' }}>{r.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </Body>
    </Html>
  );
}
