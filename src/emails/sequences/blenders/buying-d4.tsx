import { Body, Container, Head, Html, Preview, Section, Text } from 'react-email'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

type Props = { unsubscribeUrl: string; vars: Record<string, string> }

export default function BlendersBuyingD4({ unsubscribeUrl }: Props) {
  return (
    <Html><Head />
      <Preview>Quick tips from 3 years of blender testing.</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <Section>
            <Text style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 16px', lineHeight: '1.3' }}>
              3 things to check before you unbox
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 16px' }}>
              Most blender issues are avoidable. Here's what we check first:
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>1. Inspect the gasket.</strong> The rubber seal at the blade base is the most common
              failure point. Check it before the first use — replacement gaskets are $4, but they're
              easier to swap before anything leaks.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 8px' }}>
              <strong>2. Run a water blend first.</strong> Fill halfway with water and blend for 20 seconds.
              Checks for leaks and loosens any residue from manufacturing.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#111', margin: '0 0 24px' }}>
              <strong>3. Note the return window.</strong> Amazon's is 30 days. If you're going to return it,
              the blades dull noticeably after 60–90 days of daily use — well outside return windows.
              Test it properly in the first week.
            </Text>
            <Text style={{ fontSize: '14px', lineHeight: '1.6', color: '#6b7280', margin: 0 }}>
              One more email coming: what shouldit Pro can do for you if you want to go deeper.
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
