import argparse, os, time
import torch, timm
import torch.nn as nn
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

def get_loaders(data_dir, img_size=224, batch_size=32):
    train_tf = transforms.Compose([
        transforms.Resize((256,256)),
        transforms.RandomResizedCrop(img_size, scale=(0.8,1.0)),
        transforms.ColorJitter(0.2,0.2,0.2,0.05),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize((0.485,0.456,0.406),(0.229,0.224,0.225))
    ])
    eval_tf = transforms.Compose([
        transforms.Resize((img_size,img_size)),
        transforms.ToTensor(),
        transforms.Normalize((0.485,0.456,0.406),(0.229,0.224,0.225))
    ])
    train_ds = datasets.ImageFolder(os.path.join(data_dir,"train"), transform=train_tf)
    val_ds   = datasets.ImageFolder(os.path.join(data_dir,"val"),   transform=eval_tf)
    test_ds  = datasets.ImageFolder(os.path.join(data_dir,"test"),  transform=eval_tf)
    return (DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=2),
            DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=2),
            DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=2),
            train_ds.classes)

def train_one_epoch(model, loader, device, criterion, optimizer):
    model.train(); loss_sum=0; n=0
    for x,y in loader:
        x,y = x.to(device), y.to(device)
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward(); optimizer.step()
        loss_sum += loss.item() * y.size(0); n += y.size(0)
    return loss_sum / max(n,1)

@torch.no_grad()
def evaluate(model, loader, device, criterion):
    model.eval(); loss_sum=0; n=0; correct=0
    y_true=[]; y_pred=[]
    for x,y in loader:
        x,y = x.to(device), y.to(device)
        logits = model(x)
        loss = criterion(logits, y)
        loss_sum += loss.item() * y.size(0); n += y.size(0)
        pred = logits.argmax(1)
        correct += (pred==y).sum().item()
        y_true.extend(y.cpu().numpy()); y_pred.extend(pred.cpu().numpy())
    acc = correct / max(n,1)
    return loss_sum/max(n,1), acc, np.array(y_true), np.array(y_pred)

def main(args):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    train_loader, val_loader, test_loader, classes = get_loaders(args.data_dir, args.img_size, args.batch_size)

    model = timm.create_model('mobilenetv3_large_100', pretrained=True, num_classes=len(classes))
    model.to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)

    best_val = 0.0; best_path = "models/checkpoints/cls/best_cls.pth"
    os.makedirs(os.path.dirname(best_path), exist_ok=True)

    for epoch in range(args.epochs):
        tr_loss = train_one_epoch(model, train_loader, device, criterion, optimizer)
        val_loss, val_acc, y_t, y_p = evaluate(model, val_loader, device, criterion)
        print(f"Epoch {epoch+1}/{args.epochs} | train_loss={tr_loss:.4f} | val_loss={val_loss:.4f} | val_acc={val_acc:.4f}")
        if val_acc > best_val:
            best_val = val_acc
            torch.save({"model": model.state_dict(), "classes": classes}, best_path)
            print(f"  -> saved best to {best_path}")

    # test
    ckpt = torch.load(best_path, map_location=device)
    model.load_state_dict(ckpt["model"])
    test_loss, test_acc, y_t, y_p = evaluate(model, test_loader, device, criterion)
    print(f"TEST acc={test_acc:.4f}")
    print("Classes:", classes)
    print(classification_report(y_t, y_p, target_names=classes))

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data_dir", type=str, default="data/processed/classification")
    ap.add_argument("--img_size", type=int, default=224)
    ap.add_argument("--batch_size", type=int, default=16)
    ap.add_argument("--epochs", type=int, default=3)
    ap.add_argument("--lr", type=float, default=1e-3)
    args = ap.parse_args()
    main(args)
