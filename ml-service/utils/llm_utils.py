"""
LLM Utility for AI-powered recommendations using Google Gemini API
"""

import os
from typing import List, Dict, Any
import requests
import json
import logging

# Configure logging to print to console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RecommendationGenerator:
    """Generate AI-powered recommendations using Gemini API"""

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_AI_API_KEY")
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"
        self.timeout = 30  # Increased from 10s to handle network latency

        # Log API key status
        if self.api_key:
            print(f"[OK] Gemini API key loaded (length: {len(self.api_key)})")
            logger.info(
                f"[OK] Gemini API key loaded (length: {len(self.api_key)})")
        else:
            print("[ERROR] Gemini API key NOT found - will use fallback recommendations")
            logger.warning(
                "[ERROR] Gemini API key NOT found - will use fallback recommendations")

    def generate_recommendations(
        self,
        risk_level: str,
        churn_probability: float,
        contributing_factors: List[Dict[str, Any]],
        customer_id: str = None,
    ) -> List[str]:
        """
        Generate AI-powered retention recommendations based on churn risk factors

        Args:
            risk_level: low, medium, high, critical
            churn_probability: 0-1 probability value
            contributing_factors: List of dicts with factor, importance, value
            customer_id: Optional customer ID for context

        Returns:
            List of recommended actions (up to 5)
        """

        if not self.api_key:
            logger.warning(
                "GOOGLE_AI_API_KEY not set, using fallback recommendations")
            return self._fallback_recommendations(risk_level, contributing_factors)

        # Build prompt
        factors_text = "\n".join(
            [
                f"- {f['factor']}: {f['importance']*100:.1f}% impact (value: {f['value']:.2f})"
                for f in contributing_factors[:5]
            ]
        )

        prompt = f"""You are a customer retention specialist. Based on the following churn risk analysis, generate 4-5 specific, actionable retention recommendations.

CUSTOMER CHURN ANALYSIS:
- Risk Level: {risk_level.upper()}
- Churn Probability: {churn_probability*100:.1f}%
- Top Contributing Factors:
{factors_text}

REQUIREMENTS:
1. Be specific and actionable (not generic)
2. Tailor recommendations to the identified risk factors
3. Prioritize by urgency (critical > high > medium > low)
4. Include timeline/urgency where relevant
5. Keep recommendations concise (1-2 sentences each)

Respond with ONLY a JSON array of strings, like:
["Recommendation 1", "Recommendation 2", "Recommendation 3"]

No other text or explanation."""

        try:
            logger.info(
                f"[LLM] Calling Gemini API for {risk_level} churn prediction ({churn_probability*100:.1f}%)")
            print(
                f"[LLM] Calling Gemini API for {risk_level} churn prediction ({churn_probability*100:.1f}%)")

            response = requests.post(
                self.api_url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                },
                params={"key": self.api_key},
                timeout=self.timeout,
            )

            if response.status_code != 200:
                logger.error(
                    f"Gemini API error: {response.status_code} - {response.text[:200]}"
                )
                print(f"[ERROR] Gemini API error: {response.status_code}")
                print(f"Response: {response.text[:300]}")
                return self._fallback_recommendations(risk_level, contributing_factors)

            # Parse response
            response_data = response.json()
            if "candidates" not in response_data or len(response_data["candidates"]) == 0:
                logger.error("No candidates in Gemini response")
                print("[ERROR] No candidates in Gemini response")
                return self._fallback_recommendations(risk_level, contributing_factors)

            content = response_data["candidates"][0]["content"]["parts"][0]["text"]
            logger.info(f"[OK] Gemini API response received")
            print(f"[OK] Gemini API response received: {content[:100]}...")

            # Extract JSON array from response
            # Try to find JSON array in the response
            import re

            json_match = re.search(r"\[.*\]", content, re.DOTALL)
            if json_match:
                recommendations = json.loads(json_match.group())
                if isinstance(recommendations, list):
                    logger.info(
                        f"[OK] Generated {len(recommendations)} recommendations via Gemini")
                    print(
                        f"[OK] Successfully generated {len(recommendations)} AI recommendations!")
                    return recommendations[:5]

            logger.warning("Could not parse Gemini response as JSON")
            print("[WARNING] Could not parse Gemini response as JSON, using fallback")
            return self._fallback_recommendations(risk_level, contributing_factors)

        except requests.exceptions.Timeout:
            logger.error(f"Gemini API timeout after {self.timeout}s")
            print(
                f"[ERROR] Gemini API timeout after {self.timeout}s, using fallback")
            return self._fallback_recommendations(risk_level, contributing_factors)
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            print(f"[ERROR] Error calling Gemini API: {str(e)}, using fallback")
            return self._fallback_recommendations(risk_level, contributing_factors)

    def _fallback_recommendations(
        self, risk_level: str, factors: List[Dict]
    ) -> List[str]:
        """Fallback to rule-based recommendations if LLM fails"""
        recommendations = []

        if risk_level in ["high", "critical"]:
            recommendations.append(
                "Schedule urgent call with dedicated account manager")
            recommendations.append(
                "Offer exclusive retention offer valid for 7 days")

        # Analyze specific factors
        for factor in factors[:3]:
            factor_name = factor.get("factor", "").lower()
            factor_value = factor.get("value", 0)

            if "usage_frequency" in factor_name and factor_value < 0:
                recommendations.append(
                    "Send personalized feature walkthrough video"
                )
            elif "support_tickets" in factor_name and factor_value > 1:
                recommendations.append(
                    "Assign dedicated support specialist for next 30 days"
                )
            elif "payment_failures" in factor_name and factor_value > 0:
                recommendations.append(
                    "Send payment issue resolution guide + alternative payment methods"
                )
            elif "days_since_last_login" in factor_name and factor_value > 1:
                recommendations.append(
                    "Launch win-back campaign highlighting new features"
                )

        if not recommendations:
            recommendations.append("Increase engagement touchpoints")
            recommendations.append(
                "Monitor account closely for additional signals")

        return recommendations[:5]
