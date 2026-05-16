import { Body, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function DealD3({ unsubscribeUrl }: Props) {
  return (
    <Html><Head />
      <Preview>The test results, quickly.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              While you wait — why it's our pick
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              Waiting for a price drop is reasonable. While you do, here's a quick summary of why
              we chose the NutriBullet over everything else we tested.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Smoothie consistency: 94/100.</strong> Best in test. Uniform texture with no
              chunks — even with frozen berries and ice.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Cleanup: 91/100.</strong> Self-cleaning in 30 seconds. Blade assembly
              disassembles fully and is dishwasher safe.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Noise: 78 dB.</strong> Not silent, but 12 dB quieter than the Ninja at
              equivalent speed. Acceptable for morning use.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 24px' }}>
              <strong>Overall: 92/100.</strong> No blender we tested scored higher.
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
