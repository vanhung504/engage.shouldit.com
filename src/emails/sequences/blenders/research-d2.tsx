import { Body, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function BlendersResearchD2({ unsubscribeUrl }: Props) {
  return (
    <Html><Head />
      <Preview>Wattage isn't what you think it is.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              3 blender myths our testing debunked
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              After 45 blenders and three years of testing, some patterns stand out:
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Myth 1: Higher watts = better blending.</strong> We ran correlation analysis.
              Above 900W, there's almost no relationship between wattage and blend quality. The
              blade geometry matters far more. A 700W blender with good blade design beat a 1500W
              competitor in our frozen fruit test.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>Myth 2: More expensive = more durable.</strong> The $400 blenders in our test
              had the same failure rate as the $100 ones over 18 months. Price buys you features,
              not longevity.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 24px' }}>
              <strong>Myth 3: You need a tamper for thick blends.</strong> Most modern blenders
              handle thick mixtures without one if you add liquid in the right ratio. We tested this
              specifically — only 3 of the 45 blenders actually needed a tamper for nut butter.
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
