// emails/BiWeeklyReportEmail.tsx
import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text
} from '@react-email/components';

type SummaryRow = {
  name: string;
  email: string;
  hours: string; // e.g., "76.50"
  minutes: string; // e.g., "4590"
  days: string; // e.g., "10"
};

export function BiWeeklyReportEmail({
  startKey,
  endKeyExclusive,
  tz,
  summaryRows
}: {
  startKey: string;
  endKeyExclusive: string;
  tz: string;
  summaryRows: SummaryRow[];
}) {
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  };
  const thtd: React.CSSProperties = {
    padding: '8px 10px',
    borderBottom: '1px solid #ececec',
    textAlign: 'left'
  };
  const head: React.CSSProperties = {
    ...thtd,
    fontWeight: 600,
    background: '#fafafa'
  };

  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: '#f6f8fa',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          color: '#0f172a'
        }}
      >
        <Container
          style={{ margin: '0 auto', maxWidth: '640px', padding: '24px' }}
        >
          <Section
            style={{
              background: '#ffffff',
              padding: '20px 24px',
              borderRadius: 12,
              boxShadow:
                '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.10)'
            }}
          >
            <Heading
              as="h2"
              style={{ margin: 0, marginBottom: 4, fontSize: 22 }}
            >
              Bi-weekly Hours Report
            </Heading>
            <Text style={{ margin: 0, marginBottom: 16, color: '#475569' }}>
              Period: <strong>{startKey}</strong> (Sun 00:00) →{' '}
              <strong>{endKeyExclusive}</strong> (Sun 00:00, exclusive) —{' '}
              <code>{tz}</code>
            </Text>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={head}>User</th>
                  <th style={head}>Email</th>
                  <th style={{ ...head, textAlign: 'right' }}>Total Hours</th>
                  <th style={{ ...head, textAlign: 'right' }}>Total Minutes</th>
                  <th style={{ ...head, textAlign: 'right' }}>Days</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.length === 0 ? (
                  <tr>
                    <td style={thtd} colSpan={5}>
                      No records in this period.
                    </td>
                  </tr>
                ) : (
                  summaryRows.map((r, i) => (
                    <tr key={i}>
                      <td style={thtd}>{r.name}</td>
                      <td style={thtd}>{r.email}</td>
                      <td style={{ ...thtd, textAlign: 'right' }}>{r.hours}</td>
                      <td style={{ ...thtd, textAlign: 'right' }}>
                        {r.minutes}
                      </td>
                      <td style={{ ...thtd, textAlign: 'right' }}>{r.days}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <Text style={{ marginTop: 16, color: '#64748b' }}>
              CSV attachments are included (Summary & Details).
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
