import { Body, Button, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function PowerUserD5({ unsubscribeUrl }: Props) {
  return (
    <Html><Head />
      <Preview>Price tracking, custom ratings, full scores.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              Unlock all test data — shouldit Pro
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              You've seen our top-5 rankings and the methodology behind them. Pro gives you the
              rest:
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>All 45 models.</strong> Every score, every metric. Sort and filter by
              category, price, or any individual test.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Custom weighting.</strong> If noise matters more than smoothie quality for
              you, adjust the weights and the rankings update in real time.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Daily price tracking.</strong> Alert when any product you're watching hits
              a new low.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 24px' }}>
              <strong>Raw data export.</strong> CSV download of the full test dataset.
            </Text>
          </Section>
          <Section style={{ marginBottom: '24px' }}>
            <Button
              href="https://shouldit.com/pro"
              style={{ background: '#111', color: '#fff', padding: '12px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}
            >
              Try shouldit Pro →
            </Button>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
