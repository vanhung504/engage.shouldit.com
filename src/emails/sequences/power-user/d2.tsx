import { Body, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function PowerUserD2({ unsubscribeUrl }: Props) {
  return (
    <Html><Head />
      <Preview>Behind the scenes at the shouldit lab.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              How we built our test methodology
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              Every score in shouldit comes from a repeatable test protocol. Here's how it works:
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Smoothie test.</strong> 200g frozen berries, 100g banana, 250ml water.
              Blend 60 seconds. Score based on texture uniformity measured with a kitchen sieve
              (residue weight in grams, converted to 0–100 scale).
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Frozen fruit test.</strong> 300g frozen mango chunks, no liquid. 45 seconds.
              Same sieve method. This is where cheap blenders fail.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Noise test.</strong> Decibel meter at 1 metre, max reading during
              frozen-fruit run. Lower scores are better. Weighted at 15% of overall score.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 24px' }}>
              <strong>Cleanup test.</strong> Time to fully clean (disassemble, rinse, reassemble)
              converted to a score. Dishwasher-safe components score a bonus.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: 0 }}>
              Each blender is tested three times per category. We take the median.
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
