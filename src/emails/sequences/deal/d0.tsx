import { Body, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function DealD0({ unsubscribeUrl, vars }: Props) {
  const productName = vars.product_name ?? vars.product_id ?? 'this product'

  return (
    <Html><Head />
      <Preview>Here's what the price has done over 12 months.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              Price history for {productName}
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              We've been tracking this product daily for the past 12 months. Here's what we know:
            </Text>
          </Section>
          <Section style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' }}>
            <Text style={{ fontSize: '14px', fontWeight: '600', color: '#111', margin: '0 0 12px' }}>
              12-month summary
            </Text>
            <Text style={{ fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>
              Current price is in the mid-range of its historical spread.
            </Text>
            <Text style={{ fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>
              It has dropped meaningfully before — typically during major sale events.
            </Text>
            <Text style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
              Pro members get an alert the moment it hits a new low.
            </Text>
          </Section>
          <Section>
            <Text style={{ fontSize: '14px', lineHeight: '1.6', color: '#6b7280', margin: 0 }}>
              Next: while you wait, here's why we picked it in the first place.
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
