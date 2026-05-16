import { Body, Button, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function BlendersBuyingD7({ unsubscribeUrl }: Props) {
  return (
    <Html><Head />
      <Preview>Free forever is fine. But here's what Pro gets you.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              One more thing shouldit can do for you
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              The free version of shouldit gives you our picks, scores, and recommendations.
              That's it — no upsell buried in the results.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              Pro adds three things some people find useful:
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Price alerts.</strong> We track prices daily. You get an email the moment a
              product you've looked at drops below your target.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Full test data.</strong> Every score, every metric, every model. Not just our
              top pick — all 45 blenders, ranked by whatever matters to you.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 24px' }}>
              <strong>Custom ratings.</strong> Weight the scores yourself. If noise matters more than
              smoothie quality, the rankings shift accordingly.
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
