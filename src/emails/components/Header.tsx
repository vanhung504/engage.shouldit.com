import { Section, Text } from 'react-email'

export function Header() {
  return (
    <Section style={{ padding: '24px 0 16px' }}>
      <Text style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111', letterSpacing: '-0.3px' }}>
        shouldit
      </Text>
    </Section>
  )
}
