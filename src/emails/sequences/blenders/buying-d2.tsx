import { Body, Button, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

const body: React.CSSProperties = { backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }
const wrap: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: '0 24px' }
const p:    React.CSSProperties = { fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }
const sign: React.CSSProperties = { fontSize: '15px', color: '#6b7280', margin: '24px 0 0' }

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function BlendersBuyingD2({ unsubscribeUrl, vars }: Props) {
  const slug         = vars.product_id   ?? 'nutribullet-znbf30500z'
  const price        = vars.price        ?? '$124'
  const lowPrice     = vars.low_price    ?? '$89'
  const affiliateUrl = vars.affiliate_url ?? `https://shouldit.com/buy/${slug}/?ref=email`

  return (
    <Html>
      <Head />
      <Preview>Here's what the price history actually shows.</Preview>
      <Body style={body}>
        <Container style={wrap}>
          <Header />

          <Section>
            <Text style={p}>
              <strong>{price}</strong> is its standard retail price.
            </Text>
            <Text style={p}>
              It's dropped to <strong>{lowPrice}</strong> before — usually around Prime Day
              (July) and Black Friday (November). Outside those windows, it rarely dips
              more than 10–15%.
            </Text>
            <Text style={p}>
              Our read: if it's at {price} right now, it's a fair price. Don't wait for a
              deal that might not come for months.
            </Text>
            <Text style={p}>
              We'll email you if it drops below {lowPrice}. Otherwise, {price} is as good
              as it gets outside sale season.
            </Text>
          </Section>

          <Section style={{ margin: '8px 0 0' }}>
            <Button
              href={affiliateUrl}
              style={{
                background:     '#111',
                color:          '#fff',
                padding:        '12px 24px',
                borderRadius:   '6px',
                fontSize:       '14px',
                fontWeight:     '600',
                textDecoration: 'none',
                display:        'inline-block',
              }}
            >
              Check current price →
            </Button>
          </Section>

          <Text style={sign}>— The shouldit team</Text>

          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
