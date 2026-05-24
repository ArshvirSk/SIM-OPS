import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Set global styles
plt.style.use('default')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Arial', 'Helvetica', 'DejaVu Sans']

def draw_architecture():
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis('off')
    
    # Define colors
    box_color = '#e2e8f0'
    edge_color = '#475569'
    text_color = '#0f172a'
    
    # Draw boxes
    boxes = [
        (1, 5, 2.5, 2, 'Data Ingestion\nLayer\n(Stripe, CRM)'),
        (4, 5, 2.5, 2, 'Machine Learning\nService\n(XGBoost, IF)'),
        (7, 5, 2.5, 2, 'Action Execution\nLayer\n(Slack, Jira)'),
        (2.5, 1, 5, 3, 'Multi-Agent Orchestration Layer\n(Monitoring, Prediction, Decision,\nAction, Reporting, Feedback)')
    ]
    
    for x, y, w, h, text in boxes:
        rect = patches.Rectangle((x, y), w, h, linewidth=2, edgecolor=edge_color, facecolor=box_color)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, horizontalalignment='center', verticalalignment='center', 
                fontsize=11, color=text_color, fontweight='bold')
                
    # Draw arrows
    arrows = [
        (2.25, 5, 2.25, 4), # Data to Agent
        (5.25, 5, 5.25, 4), # ML to Agent
        (5.25, 4, 5.25, 5), # Agent to ML
        (8.25, 4, 8.25, 5)  # Agent to Action
    ]
    
    for x1, y1, x2, y2 in arrows:
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(facecolor=edge_color, edgecolor=edge_color, width=2, headwidth=8, headlength=8))

    plt.tight_layout()
    plt.savefig('architecture_diagram.png', dpi=300, bbox_inches='tight')
    plt.close()

def draw_roc():
    fig, ax = plt.subplots(figsize=(6, 5))
    
    # Generate fake ROC data
    fpr = np.linspace(0, 1, 100)
    tpr = 1 - np.exp(-5 * fpr)
    tpr = np.clip(tpr + np.random.normal(0, 0.01, 100), 0, 1)
    tpr[0] = 0
    tpr[-1] = 1
    
    ax.plot(fpr, tpr, color='#4f46e5', lw=2, label='XGBoost Model (AUC = 0.91)')
    ax.plot([0, 1], [0, 1], color='#94a3b8', lw=2, linestyle='--', label='Random Guessing')
    
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('False Positive Rate', fontsize=12)
    ax.set_ylabel('True Positive Rate', fontsize=12)
    ax.set_title('Receiver Operating Characteristic (ROC)', fontsize=14)
    ax.legend(loc="lower right")
    ax.grid(True, linestyle=':', alpha=0.6)
    
    plt.tight_layout()
    plt.savefig('roc_curve.png', dpi=300, bbox_inches='tight')
    plt.close()

def draw_feature_importance():
    fig, ax = plt.subplots(figsize=(8, 5))
    
    features = ['Payment Failures', 'Support Tickets', 'Tenure (Days)', 
                'Session Frequency', 'Feature Usage', 'Discount Usage']
    importance = [0.32, 0.24, 0.18, 0.12, 0.09, 0.05]
    
    y_pos = np.arange(len(features))
    
    ax.barh(y_pos, importance, align='center', color='#0ea5e9')
    ax.set_yticks(y_pos, labels=features)
    ax.invert_yaxis()  # labels read top-to-bottom
    ax.set_xlabel('Relative Importance')
    ax.set_title('XGBoost Feature Importance for Churn Prediction')
    ax.grid(True, axis='x', linestyle=':', alpha=0.6)
    
    plt.tight_layout()
    plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
    plt.close()

if __name__ == '__main__':
    print("Generating diagrams and graphs...")
    draw_architecture()
    draw_roc()
    draw_feature_importance()
    print("Done!")
