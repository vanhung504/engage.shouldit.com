import { Body, Button, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function BlendersResearchD7({ unsubscribeUrl, vars }: Props) {
  const useCase = vars.use_case ?? 'your use case'
  const productId = vars.product_id ?? 'nutribullet-znbf30500z'

  return (
    <Html><Head />
      <Preview>Based on what you told us.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              Our final pick for {useCase}
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              Based on everything you've told us, the <strong>NutriBullet Full-Size</strong> is
              still our recommendation. It scored highest in our tests for the scenarios that match
              your use case, and it's priced fairly for what it delivers.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 24px' }}>
              If you want to dig deeper — all 45 models, every metric, custom-weighted by what
              matters to you — that's what shouldit Pro is for.
            </Text>
          </Section>
          <Section style={{ marginBottom: '24px' }}>
            <Button
              href={`https://shouldit.com/buy/${productId}/?ref=email`}
              style={{ background: '#111', color: '#fff', padding: '12px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', marginRight: '12px' }}
            >
              See full scores →
            </Button>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
